import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import OpenAI from 'openai';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { existsSync, mkdirSync } from 'fs';
import { promises as fs } from 'fs';
import path from 'path';
import { Repository } from 'typeorm';
import { Feature } from './entities/feature.entity';
import { Project, ProjectStatus } from './entities/project.entity';
import { RtmEntry } from './entities/rtm.entity';
import { TestCase } from './entities/test-case.entity';
import { UserStory } from './entities/user-story.entity';
import { User } from '../auth/user.entity';
import { TeamMember } from '../team/entities/team-member.entity';
import { TeamActivity } from '../team/entities/team-activity.entity';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'srs');

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);
  private openAi: OpenAI | null = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(UserStory)
    private readonly userStoryRepository: Repository<UserStory>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TeamMember)
    private readonly teamMemberRepository: Repository<TeamMember>,
    @InjectRepository(TeamActivity)
    private readonly teamActivityRepository: Repository<TeamActivity>,
  ) {
    if (!existsSync(UPLOAD_DIR)) {
      mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  }

  async createProject(projectName: string, srsPath: string, userId?: number) {
    const project = this.projectRepository.create({
      name: projectName,
      srsPath,
      status: ProjectStatus.Queued,
      progress: 0,
      userId,
    });
    await this.projectRepository.save(project);
    if (userId) {
      const actor = await this.getActorName(userId);
      void this.logActivity(actor, `created project "${projectName}"`);
    }
    // Processed in the background within this same process - no external queue/worker required.
    void this.processProject(project.id).catch((error) => {
      this.logger.error(`Project ${project.id} processing crashed`, error?.stack || error);
    });
    return project;
  }

  async listProjects(userId: number) {
    const assignedProjectName = await this.getAssignedProjectName(userId);

    const where: object[] = [{ userId }];
    if (assignedProjectName) {
      where.push({ name: assignedProjectName });
    }

    const projects = await this.projectRepository.find({
      where,
      relations: ['features', 'userStories', 'testCases', 'rtm'],
      order: { createdAt: 'DESC' },
    });

    // Deduplicate in case a user owns a project they're also assigned to
    const seen = new Set<number>();
    const unique = projects.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    return unique.map((p) => this.enrichFromAiResponse(p));
  }

  async getProject(projectId: number, userId: number) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['features', 'userStories', 'testCases', 'rtm'],
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Owner always has access
    if (project.userId === userId) {
      return this.enrichFromAiResponse(project);
    }

    // Team members can access their assigned project
    const assignedProjectName = await this.getAssignedProjectName(userId);
    if (assignedProjectName && project.name === assignedProjectName) {
      return this.enrichFromAiResponse(project);
    }

    throw new NotFoundException('Project not found');
  }

  /**
   * Looks up the project name assigned to a user via their TeamMember record.
   * Returns null if the user has no TeamMember record or no assigned project.
   */
  private async getAssignedProjectName(userId: number): Promise<string | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return null;
    const member = await this.teamMemberRepository.findOne({ where: { email: user.email } });
    return member?.project ?? null;
  }

  private async getActorName(userId: number): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return 'Unknown';
    return `${user.firstName} ${user.lastName}`.trim();
  }

  private async logActivity(actor: string, action: string): Promise<void> {
    try {
      const entry = this.teamActivityRepository.create({ actor, action, timeLabel: 'Just now' });
      await this.teamActivityRepository.save(entry);
    } catch (err) {
      this.logger.warn(`Failed to log team activity: ${err}`);
    }
  }

  /**
   * If relation arrays are empty but aiResponse has data (e.g. cascade save was
   * skipped), fall back to the JSONB blob so the frontend always gets content.
   */
  private enrichFromAiResponse(project: Project): Project {
    const ai = project.aiResponse as Record<string, any> | null;
    if (!ai) return project;
    if (!project.features?.length && Array.isArray(ai.features)) {
      (project as any).features = ai.features;
    }
    if (!project.userStories?.length && Array.isArray(ai.userStories)) {
      (project as any).userStories = ai.userStories;
    }
    if (!project.testCases?.length && Array.isArray(ai.testCases)) {
      (project as any).testCases = ai.testCases;
    }
    if (!project.rtm?.length && Array.isArray(ai.rtm)) {
      (project as any).rtm = ai.rtm;
    }
    return project;
  }

  async deleteProject(projectId: number, userId: number) {
    const project = await this.projectRepository.findOne({ where: { id: projectId, userId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    await this.projectRepository.remove(project);
    const actor = await this.getActorName(userId);
    void this.logActivity(actor, `deleted project "${project.name}"`);
  }

  async listUserStories(projectId: number) {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.userStoryRepository.find({ where: { project: { id: projectId } }, order: { id: 'ASC' } });
  }

  async getUserStory(projectId: number, storyId: number) {
    const story = await this.userStoryRepository.findOne({ where: { id: storyId, project: { id: projectId } } });
    if (!story) {
      throw new NotFoundException('User story not found');
    }
    return story;
  }

  async createUserStory(
    projectId: number,
    dto: { actor?: string; goal: string; benefit?: string; acceptanceCriteria?: string },
    userId?: number,
  ) {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const story = this.userStoryRepository.create({
      actor: dto.actor,
      goal: dto.goal,
      benefit: dto.benefit,
      acceptanceCriteria: dto.acceptanceCriteria,
      source: 'manual',
      project,
    });
    const saved = await this.userStoryRepository.save(story);
    if (userId) {
      const actorName = await this.getActorName(userId);
      void this.logActivity(actorName, `added a user story to project "${project.name}"`);
    }
    return saved;
  }

  async updateUserStory(
    projectId: number,
    storyId: number,
    dto: { actor?: string; goal?: string; benefit?: string; acceptanceCriteria?: string },
    userId?: number,
  ) {
    const story = await this.userStoryRepository.findOne({ where: { id: storyId, project: { id: projectId } }, relations: ['project'] });
    if (!story) {
      throw new NotFoundException('User story not found');
    }

    Object.assign(story, dto);
    const saved = await this.userStoryRepository.save(story);
    if (userId) {
      const actorName = await this.getActorName(userId);
      void this.logActivity(actorName, `updated a user story in project "${story.project?.name ?? projectId}"`);
    }
    return saved;
  }

  async deleteUserStory(projectId: number, storyId: number, userId?: number) {
    const story = await this.userStoryRepository.findOne({ where: { id: storyId, project: { id: projectId } }, relations: ['project'] });
    if (!story) {
      throw new NotFoundException('User story not found');
    }
    const projectName = story.project?.name ?? String(projectId);
    await this.userStoryRepository.remove(story);
    if (userId) {
      const actorName = await this.getActorName(userId);
      void this.logActivity(actorName, `removed a user story from project "${projectName}"`);
    }
  }

  private async processProject(projectId: number) {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });

    if (!project) {
      throw new NotFoundException(`No project found for id ${projectId}`);
    }

    await this.updateProjectStatus(projectId, ProjectStatus.Processing);

    const reportProgress = (value: number) => this.updateProjectProgress(projectId, value);

    await reportProgress(10);

    try {
      const rawText = await this.extractTextFromFile(project.srsPath);
      await reportProgress(30);
      const cleanedText = this.cleanText(rawText);
      await reportProgress(45);
      const structured = await this.callOpenAi(cleanedText, project.name);
      await reportProgress(65);
      await this.persistStructuredOutput(project, cleanedText, structured);
      await reportProgress(100);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown processing error';
      await this.projectRepository.update(projectId, {
        status: ProjectStatus.Failed,
        failureReason: message,
        progress: 100,
      });
      this.logger.error(`Project ${projectId} failed: ${message}`);
      throw error;
    }
  }

  private async persistStructuredOutput(project: Project, cleanedText: string, structured: Record<string, any>) {
    project.extractedText = cleanedText;
    project.aiResponse = structured;
    project.progress = 100;
    project.features = this.mapFeatures(
      Array.isArray(structured.features) ? structured.features : [],
      project,
    );
    project.userStories = this.mapUserStories(
      Array.isArray(structured.userStories) ? structured.userStories : [],
      project,
    );
    project.testCases = this.mapTestCases(
      Array.isArray(structured.testCases) ? structured.testCases : [],
      project,
    );
    project.rtm = this.mapRtm(
      Array.isArray(structured.rtm) ? structured.rtm : [],
      project,
    );
    project.failureReason = undefined;
    project.status = ProjectStatus.Completed;
    await this.projectRepository.save(project);
    this.logger.log(`Project ${project.id} completed with ${project.features.length} features`);
  }

  private mapFeatures(rawFeatures: any[], project: Project): Feature[] {
    return rawFeatures.map((raw) => {
      const feature = new Feature();
      feature.title = typeof raw.title === 'string' ? raw.title : raw.name ?? 'Unnamed feature';
      feature.description = raw.description ?? raw.details ?? '';
      feature.project = project;
      return feature;
    });
  }

  private getOpenAiClient() {
    if (this.openAi) {
      return this.openAi;
    }

    const key = this.configService.get<string>('NVIDIA_API_KEY') || this.configService.get<string>('OPENAI_API_KEY');
    if (!key) {
      throw new Error('NVIDIA_API_KEY must be configured to process SRS documents');
    }

    const baseURL = this.configService.get<string>('NVIDIA_BASE_URL') || 'https://integrate.api.nvidia.com/v1';
    this.openAi = new OpenAI({
      apiKey: key,
      baseURL,
      timeout: 120000,
      defaultHeaders: { 'User-Agent': 'curl/8.5.0' },
    });
    return this.openAi;
  }

  private mapUserStories(rawStories: any[], project: Project): UserStory[] {
    return rawStories.map((raw) => {
      const story = new UserStory();
      story.actor = raw.user ?? raw.actor ?? 'User';
      story.goal = raw.goal ?? raw.objective ?? 'Undefined goal';
      story.benefit = raw.benefit ?? raw.reason ?? '';
      story.acceptanceCriteria = this.stringifyAcceptance(raw.acceptanceCriteria ?? raw.criteria);
      story.source = 'ai';
      story.project = project;
      return story;
    });
  }

  private mapTestCases(rawCases: any[], project: Project): TestCase[] {
    return rawCases.map((raw, index) => {
      const testCase = new TestCase();
      testCase.testCaseId = raw.testCaseId ?? raw.id ?? `TC-${index + 1}`;
      testCase.title = raw.title ?? raw.name ?? 'Untitled test case';
      testCase.preconditions = raw.preconditions ?? raw.pre ?? '';
      testCase.steps = this.stringifySteps(raw.steps ?? raw.actions);
      testCase.expectedResult = raw.expectedResult ?? raw.outcome ?? '';
      testCase.project = project;
      return testCase;
    });
  }

  private mapRtm(rawRtm: any[], project: Project): RtmEntry[] {
    return rawRtm.map((raw, index) => {
      const entry = new RtmEntry();
      entry.requirementId = raw.requirementId ?? `REQ-${index + 1}`;
      entry.description = raw.description ?? raw.details ?? 'No description provided';
      entry.linkedUserStories = this.toStringArray(raw.linkedUserStories ?? raw.linkedStories ?? raw.userStories);
      entry.linkedTestCases = this.toStringArray(raw.testCases ?? raw.linkedTestCases);
      entry.project = project;
      return entry;
    });
  }

  private toStringArray(value: any): string[] {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map((v) => String(v));
    }
    return [String(value)];
  }

  private stringifySteps(value: any): string {
    if (!value) return '';
    if (Array.isArray(value)) {
      return value.map((step, index) => `${index + 1}. ${step}`).join('\n');
    }
    return String(value);
  }

  private stringifyAcceptance(value: any): string {
    if (!value) return '';
    if (Array.isArray(value)) {
      return value.join('\n');
    }
    if (typeof value === 'object') {
      return Object.values(value).join('\n');
    }
    return String(value);
  }

  private cleanText(text: string) {
    return text.replace(/\s+/g, ' ').trim();
  }

  private async extractTextFromFile(filePath: string) {
    const extension = path.extname(filePath).toLowerCase();
    if (extension === '.pdf') {
      const buffer = await fs.readFile(filePath);
      const parsed = await pdfParse(buffer);
      return parsed.text;
    }

    if (extension === '.docx' || extension === '.doc') {
      const content = await mammoth.extractRawText({ path: filePath });
      return content.value;
    }

    throw new BadRequestException('Unsupported document type');
  }

  private async callOpenAi(text: string, projectName: string) {
    // Truncate to ~12 000 chars to stay well within context limits
    // Tight input budget so the model has maximum room for output
    const truncated = text.length > 5000 ? text.slice(0, 5000) + '\n[...truncated...]' : text;
    const model = this.configService.get<string>('NVIDIA_MODEL') || 'meta/llama-3.1-70b-instruct';
    this.logger.log(`Calling AI model: ${model}`);

    const controller = new AbortController();
    const hardTimer = setTimeout(() => {
      this.logger.warn(`AI call hard-timeout after 180 s [model=${model}]`);
      controller.abort();
    }, 180000);

    try {
      const response = await this.getOpenAiClient().chat.completions.create(
        {
          model,
          messages: [
            {
              role: 'system',
              content:
                'You are a requirements analyst. Output ONLY a raw JSON object — absolutely no markdown, no ```json fences, no explanation. Schema: {"features":[{"title":"string","description":"string"}],"userStories":[{"actor":"string","goal":"string","benefit":"string","acceptanceCriteria":"string"}],"testCases":[{"testCaseId":"TC-1","title":"string","preconditions":"string","steps":"string","expectedResult":"string"}],"rtm":[{"requirementId":"REQ-1","description":"string","linkedUserStories":["US-1"],"linkedTestCases":["TC-1"]}],"analytics":{"totalFeatures":0,"totalUserStories":0,"totalTestCases":0,"totalRequirements":0,"coverageSummary":"string","riskAreas":["string"]}}. STRICT LIMITS: max 5 items per array, max 60 chars per string value. Close every bracket. Valid JSON only.',
            },
            {
              role: 'user',
              content: `Project: ${projectName}\n\nSRS Content:\n${truncated}\n\nReturn the JSON object now:`,
            },
          ],
          temperature: 0.1,
          max_tokens: 4096,
          stream: false,
        },
        { signal: controller.signal },
      );

      clearTimeout(hardTimer);

      const raw: string = (response as any)?.choices?.[0]?.message?.content || '';
      const finishReason = (response as any)?.choices?.[0]?.finish_reason;
      this.logger.log(`AI done. finish_reason=${finishReason}, raw length=${raw.length}`);
      this.logger.log(`AI preview: ${raw.slice(0, 300)}`);

      if (!raw) {
        throw new Error('LLM returned empty content — check model name and API key');
      }
      if (finishReason === 'length') {
        this.logger.warn('Response was cut off (finish_reason=length) — attempting JSON repair');
      }

      const jsonStr = this.extractJson(raw);
      try {
        return JSON.parse(jsonStr);
      } catch {
        // Try to salvage a truncated response by closing open structures
        const repaired = this.repairJson(jsonStr);
        this.logger.warn(`Attempting repaired JSON parse`);
        return JSON.parse(repaired);
      }
    } catch (error) {
      clearTimeout(hardTimer);
      const detail = error instanceof Error ? error.message : String(error);
      this.logger.error(`AI request failed [model=${model}]: ${detail}`);
      throw new Error(`AI processing failed: ${detail}`);
    }
  }

  /** Best-effort repair of truncated JSON by closing unclosed structures. */
  private repairJson(raw: string): string {
    let s = raw.trimEnd();
    // Remove any trailing comma before we close
    s = s.replace(/,\s*$/, '');
    // Count unclosed braces/brackets
    const stack: string[] = [];
    let inString = false;
    let escape = false;
    for (const ch of s) {
      if (escape) { escape = false; continue; }
      if (ch === '\\' && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') stack.push('}');
      else if (ch === '[') stack.push(']');
      else if (ch === '}' || ch === ']') stack.pop();
    }
    // Close in reverse order
    return s + stack.reverse().join('');
  }

  private extractJson(raw: string) {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced && fenced[1]) {
      return fenced[1].trim();
    }
    const first = raw.indexOf('{');
    const last = raw.lastIndexOf('}');
    if (first !== -1 && last !== -1) {
      return raw.slice(first, last + 1);
    }
    return raw;
  }

  private async updateProjectStatus(projectId: number, status: ProjectStatus) {
    await this.projectRepository.update(projectId, { status });
  }

  private async updateProjectProgress(projectId: number, progress: number) {
    await this.projectRepository.update(projectId, { progress });
  }
}
