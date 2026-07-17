import { RuntimeImage } from "@/components/ui/runtime-image";
import { cn } from "@/lib/utils";
import type { Experimental_GeneratedImage } from "ai";

export type ImageProps = Experimental_GeneratedImage & {
  className?: string;
  alt?: string;
};

export const Image = ({
  alt,
  base64,
  className,
  mediaType,
}: ImageProps) => (
  <RuntimeImage
    alt={alt ?? ""}
    className={cn(
      "h-auto max-w-full overflow-hidden rounded-md",
      className
    )}
    src={`data:${mediaType};base64,${base64}`}
  />
);
