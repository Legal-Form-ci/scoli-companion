import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MathCaptchaProps {
  onValidChange: (isValid: boolean) => void;
}

const MathCaptcha = ({ onValidChange }: MathCaptchaProps) => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [operator, setOperator] = useState<"+" | "-" | "×" | "÷">("+");
  const [answer, setAnswer] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState(0);

  const generateChallenge = useCallback(() => {
    const ops: Array<"+" | "-" | "×" | "÷"> = ["+", "-", "×", "÷"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a: number, b: number, result: number;

    switch (op) {
      case "+":
        a = Math.floor(Math.random() * 20) + 1;
        b = Math.floor(Math.random() * 20) + 1;
        result = a + b;
        break;
      case "-":
        a = Math.floor(Math.random() * 20) + 5;
        b = Math.floor(Math.random() * a) + 1;
        result = a - b;
        break;
      case "×":
        a = Math.floor(Math.random() * 10) + 1;
        b = Math.floor(Math.random() * 10) + 1;
        result = a * b;
        break;
      case "÷":
        b = Math.floor(Math.random() * 9) + 2;
        result = Math.floor(Math.random() * 10) + 1;
        a = b * result;
        break;
      default:
        a = 1; b = 1; result = 2;
    }

    setNum1(a);
    setNum2(b);
    setOperator(op);
    setCorrectAnswer(result);
    setAnswer("");
    onValidChange(false);
  }, [onValidChange]);

  useEffect(() => {
    generateChallenge();
  }, [generateChallenge]);

  useEffect(() => {
    const userAnswer = parseInt(answer, 10);
    onValidChange(!isNaN(userAnswer) && userAnswer === correctAnswer);
  }, [answer, correctAnswer, onValidChange]);

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm">
        <ShieldCheck size={16} className="text-primary" />
        Vérification de sécurité
      </Label>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg font-mono text-lg font-bold text-foreground select-none">
          <span>{num1}</span>
          <span className="text-primary">{operator}</span>
          <span>{num2}</span>
          <span className="text-muted-foreground">=</span>
        </div>
        <Input
          type="number"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="?"
          className="w-20 text-center text-lg font-bold"
          autoComplete="off"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={generateChallenge}
          title="Nouveau calcul"
          className="shrink-0"
        >
          <RefreshCw size={16} />
        </Button>
      </div>
    </div>
  );
};

export default MathCaptcha;
