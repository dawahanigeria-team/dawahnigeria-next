import Image from "next/image";
import Link from "next/link";
import { FiArrowRight, FiHeadphones } from "react-icons/fi";
import { ROUTES } from "@/lib/routes";
import { formatDuration, resolveLecture } from "../../lectureFields";
import { getFeaturedLecture } from "../../server/landing";
import { getListeningPreferences } from "@/features/preferences/server";

export async function HeroSection() {
  const preferences = await getListeningPreferences();
  const featured = await getFeaturedLecture(preferences);

  if (!featured) return null;

  const lecture = resolveLecture(featured);
  const duration = formatDuration(lecture.duration);
  const lecturer =
    lecture.lecturer &&
    !lecture.title.toLocaleLowerCase().includes(lecture.lecturer.toLocaleLowerCase())
      ? lecture.lecturer
      : undefined;

  return (
    <section
      aria-labelledby="featured-lecture-title"
      className="relative isolate mb-8 min-h-[260px] overflow-hidden rounded-[20px] border border-white/10 bg-[#071c18] shadow-[0_20px_60px_rgba(0,0,0,0.28)] mobile:mb-6 mobile:min-h-[300px] mobile:rounded-2xl"
    >
      {lecture.image ? (
        <Image
          src={lecture.image}
          alt=""
          fill
          sizes="(max-width: 615px) 100vw, 73vw"
          loading="eager"
          fetchPriority="high"
          className="object-cover object-center opacity-70 mobile:object-[65%_center]"
        />
      ) : null}

      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,18,15,0.98)_0%,rgba(3,18,15,0.88)_42%,rgba(3,18,15,0.18)_100%)] mobile:bg-[linear-gradient(0deg,rgba(3,18,15,0.98)_0%,rgba(3,18,15,0.72)_72%,rgba(3,18,15,0.32)_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_18%_20%,rgba(221,255,0,0.45),transparent_24%)]"
      />

      <div className="relative z-10 flex min-h-[260px] max-w-[660px] flex-col justify-center px-8 py-8 mobile:min-h-[300px] mobile:justify-end mobile:px-5 mobile:py-6">
        <div className="mb-4 flex w-fit items-center gap-2 rounded-full border border-[#ddff00]/30 bg-[#ddff00]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#ddff00]">
          <FiHeadphones aria-hidden />
          {preferences.configured ? "Chosen for you" : "Fresh from DawahCast"}
        </div>
        <h2
          id="featured-lecture-title"
          className="max-w-[18ch] text-balance text-3xl font-bold leading-[1.08] text-white sm:text-4xl"
        >
          {lecture.title}
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/75">
          {lecturer ? <span>{lecturer}</span> : null}
          {lecturer && duration ? <span aria-hidden>•</span> : null}
          {duration ? <span>{duration}</span> : null}
        </div>
        <Link
          href={ROUTES.lecture(lecture.id)}
          prefetch={false}
          className="mt-6 inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-[#ddff00] px-5 py-2.5 text-sm font-bold text-[#071c18] transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#071c18]"
        >
          Listen now
          <FiArrowRight aria-hidden />
        </Link>
      </div>
    </section>
  );
}
