import { getSimilarByLecturer } from "../../server/audioDetail";
import { LectureRow } from "../LectureRow";

type Props = {
  lecturerId: string | number;
  lecturerName?: string;
};

export async function SimilarSection({ lecturerId, lecturerName }: Props) {
  const lectures = await getSimilarByLecturer(lecturerId, 1);
  if (!lectures?.length) return null;

  return (
    <LectureRow
      heading={lecturerName ? `More from ${lecturerName}` : "Similar lectures"}
      lectures={lectures}
    />
  );
}
