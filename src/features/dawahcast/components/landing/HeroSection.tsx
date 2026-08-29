import Image from "next/image";
import Link from "next/link";
import { FiArrowRight, FiHeadphones, FiRadio } from "react-icons/fi";
import { ROUTES } from "@/lib/routes";
import { formatDuration, resolveLecture } from "../../lectureFields";
import { getFeaturedLecture } from "../../server/landing";
import { getListeningPreferences } from "@/features/preferences/server";
import { HeroSearchBar } from "./HeroSearchBar";
import { DownloadButton } from "../DownloadButton";

export async function HeroSection() {
  const preferences = await getListeningPreferences();
  const featured = await getFeaturedLecture();

  const lecture = featured ? resolveLecture(featured) : null;
  const duration = lecture ? formatDuration(lecture.duration) : undefined;
  const lecturer =
    lecture?.lecturer &&
    !lecture.title.toLocaleLowerCase().includes(lecture.lecturer.toLocaleLowerCase())
      ? lecture.lecturer
      : undefined;

  return (
    <section
      aria-label="Discovery and Featured Content"
      className="relative isolate mb-8 overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#041411_0%,#092b23_50%,#031612_100%)] p-6 shadow-2xl mobile:mb-6 mobile:p-5 sm:p-8"
    >
      {/* Subtle decorative background glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#ddff00]/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-[#00ffaa]/10 blur-3xl"
      />

      <div className="relative z-10 flex flex-col gap-8">
        {/* Top Hero Discovery Hub */}
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-dncolor-500/30 bg-dncolor-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-dncolor-500">
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-4xl sm:leading-[1.15]">
            Find & Download Islamic Lectures and Recitations
          </h1>

          <p className="mt-2 text-sm text-white/75 sm:text-base">
            Search hundreds of scholars, topics, and surahs in Hausa, Yoruba, English, Arabic, and more.
          </p>

          <div className="mt-5">
            <HeroSearchBar />
          </div>
        </div>

        {/* Featured Lecture Spotlight Bar */}
        {lecture && (
          <div className="relative isolate overflow-hidden rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-md transition-all hover:border-white/20 sm:p-5">
            {lecture.image && (
              <div className="pointer-events-none absolute inset-0 -z-10 opacity-15">
                <Image
                  src={lecture.image}
                  alt=""
                  fill
                  sizes="100vw"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#041411] via-[#041411]/90 to-transparent" />
              </div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3.5">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted shadow-md sm:h-16 sm:w-16">
                  {lecture.image && (
                    <Image
                      src={lecture.image}
                      alt={lecture.title}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  )}
                  <div className="absolute inset-0 grid place-items-center bg-black/20 text-white">
                    <FiHeadphones className="h-5 w-5" aria-hidden />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-dncolor-500">
                      {preferences.configured ? "Recommended For You" : "Featured Release"}
                    </span>
                    {duration && (
                      <span className="text-[11px] text-white/50">• {duration}</span>
                    )}
                  </div>
                  <Link
                    href={ROUTES.lecture(lecture.id)}
                    className="mt-0.5 block truncate text-base font-semibold text-white hover:text-dncolor-500 sm:text-lg"
                  >
                    {lecture.title}
                  </Link>
                  {lecturer && (
                    <p className="truncate text-xs text-white/70 sm:text-sm">
                      {lecturer}
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex shrink-0 items-center gap-2.5 self-start sm:self-center">
                <Link
                  href={ROUTES.lecture(lecture.id)}
                  prefetch={false}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-dncolor-500 px-4 py-2 text-xs font-bold text-[#071c18] transition-transform hover:scale-105 hover:bg-white focus-visible:outline-none sm:text-sm"
                >
                  <span>Listen Now</span>
                  <FiArrowRight aria-hidden />
                </Link>

                <DownloadButton
                  lectureId={String(lecture.id)}
                  title={lecture.title}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20 sm:text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
