import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProblemInput from "@/components/ProblemInput";
import { Book } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Book className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Math Problem Analyzer
            </h1>
          </div>
          <p className="text-muted-foreground">
            Upload or type your math problem to get a structured solution template
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Input Your Math Problem</CardTitle>
          </CardHeader>
          <CardContent>
            <ProblemInput />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
