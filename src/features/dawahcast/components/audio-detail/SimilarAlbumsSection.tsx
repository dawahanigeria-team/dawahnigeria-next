import { getSimilarAlbums } from "../../server/audioDetail";
import { LectureRow } from "../LectureRow";

type Props = {
  lecturerId: string | number;
  lecturerName?: string;
};

export async function SimilarAlbumsSection({ lecturerId, lecturerName }: Props) {
  const albums = await getSimilarAlbums(lecturerId, 1);
  if (!albums?.length) return null;

  return (
    <LectureRow
      heading={lecturerName ? `More albums by ${lecturerName}` : "Similar albums"}
      lectures={albums}
    />
  );
}
