import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  passwordHash: string;

  @Column({ nullable: true })
  googleId?: string;

  @Column({ default: false })
  verified: boolean;

  @Column({ type: 'varchar', default: 'member' })
  role: 'admin' | 'member';

  @Column({ nullable: true })
  companyName?: string;

  @Column({ nullable: true })
  jobTitle?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}