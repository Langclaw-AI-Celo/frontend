import type { ComponentProps } from "react";

export type RuntimeImageProps = ComponentProps<"img"> & {
  alt: string;
};

export function RuntimeImage({ alt, ...props }: RuntimeImageProps) {
  // These previews use runtime blob URLs, data URLs, or small external SVGs.
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} alt={alt} />;
}
