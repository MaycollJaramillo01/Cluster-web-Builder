import { buildImageQuery } from "@/lib/site/images";

type VideoRequest = {
  prompt?: string;
  businessType: string;
  seed: string;
};

export function sectionVideoUrl(request: VideoRequest) {
  const query = buildImageQuery({
    prompt: request.prompt,
    businessType: request.businessType,
    width: 1600,
    height: 900,
    section: "hero",
  });
  const params = new URLSearchParams({
    q: query.slice(0, 80),
    seed: request.seed,
  });
  return `/api/videos/pexels?${params}`;
}
