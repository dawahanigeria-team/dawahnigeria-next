import { getSimilarByCategory } from "../../server/audioDetail";
import { ROUTES } from "@/lib/routes";
import { LectureRow } from "../LectureRow";

type Props = {
  categoryId: string | number;
  excludeId?: string;
};

export async function SimilarByCategorySection({ categoryId, excludeId }: Props) {
  const lectures = await getSimilarByCategory(categoryId, excludeId).catch(() => []);
  if (!lectures.length) return null;

  return (
    <LectureRow
      heading="Similar Audio"
      lectures={lectures}
      moreHref={ROUTES.category(categoryId)}
    />
  );
}
