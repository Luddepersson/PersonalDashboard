import { z } from "zod";

export const todoSchema = z.object({
  text: z.string().min(1),
  done: z.boolean().optional(),
  team_id: z.string().optional(),
});

export const habitSchema = z.object({
  name: z.string().min(1),
  color: z.string().min(1),
});

export const completionSchema = z.object({
  date: z.string().min(1),
});

export const reminderSchema = z.object({
  title: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  color: z.string().min(1),
  team_id: z.string().optional(),
});

export const noteSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  team_id: z.string().optional(),
});

export const linkSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1),
  icon: z.string().min(1),
  color: z.string().min(1),
});

export const pomodoroSchema = z.object({
  mode: z.string().min(1),
  duration_min: z.number().int().positive(),
});

export const trackSchema = z.object({
  title: z.string().min(1),
  artist: z.string().min(1),
});

export const teamSchema = z.object({
  name: z.string().min(1),
});

export const chatMessageSchema = z.object({
  content: z.string().min(1),
});

export const inviteSchema = z.object({
  email: z.string().email(),
});

export const profileUpdateSchema = z.object({
  name: z.string().optional(),
  github_username: z.string().optional(),
  theme: z.string().optional(),
});
