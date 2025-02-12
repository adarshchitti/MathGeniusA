import { MathProblem, InsertMathProblem } from "@shared/schema";

export interface IStorage {
  createProblem(problem: InsertMathProblem): Promise<MathProblem>;
  getProblem(id: number): Promise<MathProblem | undefined>;
  updateProblem(id: number, problem: Partial<InsertMathProblem>): Promise<MathProblem>;
  getAllProblems(): Promise<MathProblem[]>;
}

export class MemStorage implements IStorage {
  private problems: Map<number, MathProblem>;
  private currentId: number;

  constructor() {
    this.problems = new Map();
    this.currentId = 1;
  }

  async createProblem(problem: InsertMathProblem): Promise<MathProblem> {
    const id = this.currentId++;
    const newProblem = { ...problem, id };
    this.problems.set(id, newProblem);
    return newProblem;
  }

  async getProblem(id: number): Promise<MathProblem | undefined> {
    return this.problems.get(id);
  }

  async updateProblem(id: number, problem: Partial<InsertMathProblem>): Promise<MathProblem> {
    const existing = await this.getProblem(id);
    if (!existing) {
      throw new Error("Problem not found");
    }
    const updated = { ...existing, ...problem };
    this.problems.set(id, updated);
    return updated;
  }

  async getAllProblems(): Promise<MathProblem[]> {
    return Array.from(this.problems.values());
  }
}

export const storage = new MemStorage();
