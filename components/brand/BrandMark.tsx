import Image from "next/image";

export function BrandMark({ large = false }: { large?: boolean }) {
  return <Image
    src="/cluster-logo.webp"
    alt=""
    width={752}
    height={440}
    priority
    className={`${large ? "h-12 w-auto" : "h-8 w-auto"} object-contain invert`}
  />;
}
