import { redirect } from "next/navigation";

/** 예전 주소(저장한 글). 좋아요한 글로 보낸다. */
export default function BookmarksRedirect() {
  redirect("/notes/likes");
}
