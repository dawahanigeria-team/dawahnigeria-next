import { getSimilarAlbums } from "../../server/audioDetail";
import { AlbumRow } from "../AlbumRow";

type Props = {
  lecturerId: string | number;
  lecturerName?: string;
};

export async function SimilarAlbumsSection({ lecturerId, lecturerName }: Props) {
  const albums = await getSimilarAlbums(lecturerId, 1);
  if (!albums?.length) return null;

  return (
    <AlbumRow
      heading={lecturerName ? `More albums by ${lecturerName}` : "Similar albums"}
      albums={albums}
    />
  );
}
