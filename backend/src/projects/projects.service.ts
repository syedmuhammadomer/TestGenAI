import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
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
export class ProjectsService implements OnModuleInit {
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

  /** On startup, re-queue any projects that were left stuck in 'processing' or 'queued' */
  async onModuleInit() {
    const stuck = await this.projectRepository.find({
      where: [{ status: ProjectStatus.Processing }, { status: ProjectStatus.Queued }],
    });
    if (stuck.length === 0) return;
    this.logger.log(`Found ${stuck.length} stuck project(s) — reprocessing on startup`);
    for (const project of stuck) {
      await this.projectRepository.update(project.id, { status: ProjectStatus.Queued, progress: 0 });
      void this.processProject(project.id).catch((err) => {
        this.logger.error(`Startup reprocessing of project ${project.id} failed`, err?.stack || err);
      });
    }
  }

  /** Extract raw text from an in-memory file buffer (PDF or DOCX). */
  async extractTextFromBuffer(buffer: Buffer, originalname: string): Promise<string> {
    const ext = path.extname(originalname).toLowerCase();
    if (ext === '.pdf') {
      const parsed = await pdfParse(buffer);
      return parsed.text;
    }
    if (ext === '.docx' || ext === '.doc') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    throw new BadRequestException('Unsupported document type');
  }

  async createProject(projectName: string, extractedText: string, userId?: number) {
    const project = this.projectRepository.create({
      name: projectName,
      srsPath: '',
      extractedText,
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

  async reprocessProject(projectId: number, userId: number) {
    const project = await this.projectRepository.findOne({ where: { id: projectId, userId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.status === ProjectStatus.Processing || project.status === ProjectStatus.Queued) {
      throw new BadRequestException('Project is already being processed');
    }
    await this.projectRepository.update(projectId, {
      status: ProjectStatus.Queued,
      progress: 0,
      failureReason: undefined,
    });
    void this.processProject(projectId).catch((error) => {
      this.logger.error(`Reprocess of project ${projectId} crashed`, error?.stack || error);
    });
    return { message: 'Project re-queued for processing', projectId };
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

    try {
      await reportProgress(10);
      // Use text already extracted and stored in DB at upload time.
      // Falls back to file-based extraction for legacy projects that still have srsPath.
      let rawText: string;
      if (project.extractedText) {
        rawText = project.extractedText;
      } else if (project.srsPath) {
        rawText = await this.extractTextFromFile(project.srsPath);
      } else {
        throw new BadRequestException('No SRS content available for this project. Please re-upload the document.');
      }
      await reportProgress(20);
      const cleanedText = this.cleanText(rawText);
      await reportProgress(25);

      // Stage 1 — Features + User Stories
      this.logger.log(`Project ${projectId}: Stage 1 — extracting features & user stories`);
      const stage1 = await this.callAiStage1(cleanedText, project.name);
      this.logger.log(`Project ${projectId}: Stage 1 done — ${stage1.features.length} features, ${stage1.userStories.length} stories`);
      await reportProgress(50);

      // Stage 2 — Detailed test cases per user story
      this.logger.log(`Project ${projectId}: Stage 2 — generating test cases for ${stage1.userStories.length} stories`);
      const testCases = await this.callAiStage2(cleanedText, project.name, stage1.userStories);
      this.logger.log(`Project ${projectId}: Stage 2 done — ${testCases.length} test cases`);
      await reportProgress(75);

      // Stage 3 — RTM + Analytics
      this.logger.log(`Project ${projectId}: Stage 3 — building RTM & analytics`);
      const stage3 = await this.callAiStage3(project.name, stage1.features, stage1.userStories, testCases);
      this.logger.log(`Project ${projectId}: Stage 3 done — ${stage3.rtm.length} RTM entries`);
      await reportProgress(90);

      const structured = {
        features: stage1.features,
        userStories: stage1.userStories,
        testCases,
        rtm: stage3.rtm,
        analytics: stage3.analytics,
      };
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

  /** Stage 1: Extract all features and user stories from the SRS */
  private async callAiStage1(text: string, projectName: string): Promise<{ features: any[]; userStories: any[] }> {
    const truncated = text.length > 25000 ? text.slice(0, 25000) + '\n[...truncated...]' : text;

    const systemPrompt = `You are a senior business analyst. Analyse the SRS and extract all features and user stories. Output ONLY a raw JSON object — no markdown, no fences, no explanation.

Schema:
{"features":[{"title":"string","description":"Detailed explanation of what this feature does","userImpact":"How this directly benefits the end user","technicalDetails":"Implementation notes, APIs or components involved","priority":"High|Medium|Low","module":"Which module/component"}],"userStories":[{"id":"US-1","actor":"string","goal":"string","benefit":"string","acceptanceCriteria":"Numbered list of specific testable criteria","priority":"High|Medium|Low","storyPoints":3,"featureRef":"Feature title this story belongs to","dependencies":["US-2"]}]}

Rules:
- Extract EVERY feature in the document — no artificial limits
- Generate AT LEAST 2 detailed user stories per feature; more for complex features
- Acceptance criteria must be a numbered list with at minimum 3 specific, testable items per story
- Write full sentences with enough detail that a developer can act without reading the SRS
- Close every bracket. Return valid JSON only.`;

    const raw = await this.callAiWithRetry(
      systemPrompt,
      `Project: ${projectName}\n\nSRS Content:\n${truncated}\n\nExtract all features and user stories:`,
      8192,
    );
    const parsed = this.parseAiResponse(raw);
    return {
      features: Array.isArray(parsed.features) ? parsed.features : [],
      userStories: Array.isArray(parsed.userStories) ? parsed.userStories : [],
    };
  }

  /** Stage 2: Generate detailed test cases covering every user story */
  private async callAiStage2(text: string, projectName: string, userStories: any[]): Promise<any[]> {
    const truncated = text.length > 12000 ? text.slice(0, 12000) + '\n[...truncated...]' : text;
    const storiesSummary = userStories.map((s, i) => ({
      id: s.id ?? `US-${i + 1}`,
      actor: s.actor,
      goal: s.goal,
      acceptanceCriteria: s.acceptanceCriteria,
    }));

    const systemPrompt = `You are a senior QA architect. Generate comprehensive test cases for EVERY user story provided. Output ONLY a raw JSON array — no markdown, no fences, no commentary.

Schema — array of test case objects:
[{"testCaseId":"TC-1","userStoryRef":"US-1","title":"string","type":"positive|negative|edge","preconditions":"All system state that must exist before this test","steps":"1. Step one\\n2. Step two\\n3. Step three","expectedResult":"Exact system behaviour and output after all steps","severity":"Critical|High|Medium|Low","category":"Functional|Security|Performance|UI|Integration"}]

MANDATORY RULES — you MUST follow these exactly:
1. For EACH user story generate a MINIMUM of 4 test cases:
   - At least 2 POSITIVE test cases: happy path, successful scenarios, valid input combinations
   - At least 1 NEGATIVE test case: invalid input, error conditions, unauthorized access, missing data
   - At least 1 EDGE case: boundary values, empty states, maximum limits, concurrent operations
2. If a story has complex acceptance criteria, generate one test case per criterion
3. Steps must be specific, numbered, and detailed enough for a tester to follow exactly
4. Expected results must describe the EXACT system response (status codes, messages, UI changes)
5. Cover security and performance concerns where applicable
6. Return a valid JSON array only — no wrapping object.`;

    const raw = await this.callAiWithRetry(
      systemPrompt,
      `Project: ${projectName}\n\nUser Stories to cover:\n${JSON.stringify(storiesSummary, null, 2)}\n\nSRS Context:\n${truncated}\n\nGenerate detailed test cases for ALL ${userStories.length} user stories (min 4 per story):`,
      16384,
    );

    const jsonStr = this.extractJson(raw);
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed.testCases)) return parsed.testCases;
    } catch { /* continue */ }
    try {
      const sanitised = this.sanitiseJson(jsonStr);
      const repaired = this.repairJson(sanitised);
      const parsed = JSON.parse(repaired);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* continue */ }
    const partial = this.extractPartialResult(jsonStr);
    return Array.isArray(partial.testCases) ? partial.testCases : [];
  }

  /** Stage 3: Build RTM and analytics from the collected data */
  private async callAiStage3(
    projectName: string,
    features: any[],
    userStories: any[],
    testCases: any[],
  ): Promise<{ rtm: any[]; analytics: any }> {
    const featSummary = features.map((f) => ({ title: f.title, priority: f.priority }));
    const storySummary = userStories.map((s, i) => ({ id: s.id ?? `US-${i + 1}`, goal: s.goal, priority: s.priority }));
    const tcSummary = testCases.map((tc, i) => ({
      id: tc.testCaseId ?? `TC-${i + 1}`,
      title: tc.title,
      type: tc.type,
      userStoryRef: tc.userStoryRef,
    }));

    const systemPrompt = `You are a requirements traceability expert. Given the features, user stories, and test cases, create the RTM and analytics summary. Output ONLY a raw JSON object — no markdown, no fences, no commentary.

Schema:
{"rtm":[{"requirementId":"REQ-1","description":"Clear description of this requirement","linkedUserStories":["US-1","US-2"],"linkedTestCases":["TC-1","TC-2","TC-3"]}],"analytics":{"totalFeatures":0,"totalUserStories":0,"totalTestCases":0,"totalRequirements":0,"coveragePercentage":85,"qualityScore":78,"coverageSummary":"Paragraph explaining coverage and quality","riskAreas":["Risk area with explanation"],"recommendations":["Actionable recommendation"],"testTypeBreakdown":{"positive":0,"negative":0,"edge":0},"priorityBreakdown":{"high":0,"medium":0,"low":0}}}

Rules:
- Create one RTM entry per high-level requirement (group related user stories under a requirement)
- Link each requirement to ALL relevant user stories and test cases by their exact IDs
- Analytics counts must match the actual numbers in the provided data
- coveragePercentage and qualityScore should be realistic assessments (0–100)
- Return valid JSON only.`;

    const raw = await this.callAiWithRetry(
      systemPrompt,
      `Project: ${projectName}\n\nFeatures (${features.length}):\n${JSON.stringify(featSummary, null, 2)}\n\nUser Stories (${userStories.length}):\n${JSON.stringify(storySummary, null, 2)}\n\nTest Cases (${testCases.length}):\n${JSON.stringify(tcSummary, null, 2)}\n\nGenerate RTM and analytics:`,
      8192,
    );
    const parsed = this.parseAiResponse(raw);
    return {
      rtm: Array.isArray(parsed.rtm) ? parsed.rtm : [],
      analytics: parsed.analytics ?? {},
    };
  }

  /** Shared AI call helper with timeout */
  private async callAiWithRetry(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> {
    const model = this.configService.get<string>('NVIDIA_MODEL') || 'meta/llama-3.1-70b-instruct';
    this.logger.log(`AI call [model=${model}, max_tokens=${maxTokens}]`);

    const controller = new AbortController();
    const hardTimer = setTimeout(() => {
      this.logger.warn(`AI hard-timeout after 600 s [model=${model}]`);
      controller.abort();
    }, 600000);

    try {
      const response = await this.getOpenAiClient().chat.completions.create(
        {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.1,
          max_tokens: maxTokens,
          stream: false,
        },
        { signal: controller.signal },
      );
      clearTimeout(hardTimer);
      const raw: string = (response as any)?.choices?.[0]?.message?.content || '';
      const finishReason = (response as any)?.choices?.[0]?.finish_reason;
      this.logger.log(`AI done. finish_reason=${finishReason}, length=${raw.length}`);
      if (!raw) throw new Error('LLM returned empty content — check model name and API key');
      if (finishReason === 'length') this.logger.warn('Response cut off (length) — attempting repair');
      return raw;
    } catch (error) {
      clearTimeout(hardTimer);
      const detail = error instanceof Error ? error.message : String(error);
      this.logger.error(`AI request failed [model=${model}]: ${detail}`);
      throw new Error(`AI processing failed: ${detail}`);
    }
  }

  /** Parse AI JSON response with fallback repair */
  private parseAiResponse(raw: string): Record<string, any> {
    const jsonStr = this.extractJson(raw);
    try { return JSON.parse(jsonStr); } catch { /* continue */ }
    const sanitised = this.sanitiseJson(jsonStr);
    try { return JSON.parse(sanitised); } catch { /* continue */ }
    const repaired = this.repairJson(sanitised);
    try { return JSON.parse(repaired); } catch { /* continue */ }
    this.logger.warn('Full parse failed — extracting partial arrays');
    return this.extractPartialResult(jsonStr);
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
      timeout: 600000,
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

  /** Replace unescaped control characters inside JSON strings */
  private sanitiseJson(raw: string): string {
    // Replace literal tab/newline/CR inside string values with their escape sequences
    let result = '';
    let inString = false;
    let escape = false;
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (escape) { result += ch; escape = false; continue; }
      if (ch === '\\') { result += ch; if (inString) escape = true; continue; }
      if (ch === '"') { inString = !inString; result += ch; continue; }
      if (inString) {
        if (ch === '\n') { result += '\\n'; continue; }
        if (ch === '\r') { result += '\\r'; continue; }
        if (ch === '\t') { result += '\\t'; continue; }
        // Remove other control characters
        if (ch.charCodeAt(0) < 0x20) continue;
      }
      result += ch;
    }
    return result;
  }

  /** Last-resort: try to parse each top-level array key individually */
  private extractPartialResult(raw: string): Record<string, any> {
    const keys = ['features', 'userStories', 'testCases', 'rtm', 'analytics'];
    const result: Record<string, any> = {};
    for (const key of keys) {
      const match = raw.match(new RegExp(`"${key}"\\s*:\\s*(\\[|\\{)`));
      if (!match || match.index === undefined) continue;
      const start = match.index + match[0].length - 1;
      const open = raw[start];
      const close = open === '[' ? ']' : '}';
      let depth = 0;
      let end = start;
      let inStr = false;
      let esc = false;
      for (let i = start; i < raw.length; i++) {
        const c = raw[i];
        if (esc) { esc = false; continue; }
        if (c === '\\' && inStr) { esc = true; continue; }
        if (c === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (c === open) depth++;
        else if (c === close) { depth--; if (depth === 0) { end = i; break; } }
      }
      try {
        result[key] = JSON.parse(raw.slice(start, end + 1));
      } catch {
        result[key] = open === '[' ? [] : {};
      }
    }
    if (!result.features) result.features = [];
    if (!result.userStories) result.userStories = [];
    if (!result.testCases) result.testCases = [];
    if (!result.rtm) result.rtm = [];
    this.logger.warn(`Partial extraction: features=${result.features?.length}, stories=${result.userStories?.length}, tests=${result.testCases?.length}`);
    return result;
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
