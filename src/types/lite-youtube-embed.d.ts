import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "lite-youtube-embed/src/lite-yt-embed.js";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "lite-youtube": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          params?: string;
          playlabel?: string;
          videoid: string;
        },
        HTMLElement
      >;
    }
  }
}
