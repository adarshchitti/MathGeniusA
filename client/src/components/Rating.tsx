import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  value?: number;
  onChange: (value: number) => void;
}

export default function Rating({ value = 0, onChange }: RatingProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => onChange(rating)}
          className={cn(
            "p-1 hover:text-yellow-400 transition-colors",
            rating <= value ? "text-yellow-400" : "text-gray-300"
          )}
        >
          <Star className="h-6 w-6 fill-current" />
        </button>
      ))}
    </div>
  );
}
