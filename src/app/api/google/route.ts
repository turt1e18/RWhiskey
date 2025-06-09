import axios from "axios";
import { NextResponse } from "next/server";

const ACCESS_KEY = process.env.GOOGLESEARCH_ACCESS_KEY;
const ACCESS_KEY2 = process.env.GOOGLESEARCHID_ACCESS_KEY;

export async function POST(req: Request) {
  const body = await req.json();
  const data = body.data;
  const type = body.type;

  if (!ACCESS_KEY) {
    console.log({
      err: "API key is MIA"
    });
  }
  try {
    const result = await axios
      .get("https://customsearch.googleapis.com/customsearch/v1", {
        params: {
          q: data,
          searchType: "image",
          num: type === 1 ? 3 : 1,
          key: ACCESS_KEY,
          cx: ACCESS_KEY2
        }
      })
      .then(async (res) => {
        console.log(res);
        if (type === 1) {
          const result = res.data.items
            .map((item: any) => item.image?.thumbnailLink)
            .filter(
              (link: string | undefined) =>
                typeof link === "string" && link.startsWith("http")
            );
          return NextResponse.json(result);
          // return res.data.items
          //   .map((item: any) => item.image?.thumbnailLink)
          //   .filter(
          //     (link: string | undefined) =>
          //       typeof link === "string" && link.startsWith("http")
          //   );
        } else {
          if (res.data.items && res.data.items.length > 0) {
            return NextResponse.json(res.data.items[0].link); // JSON 리턴
          } else {
            console.log(res.data);
            console.warn("We can't Find Image", data);
            return NextResponse.json(null);
          }
        }
      })
      .catch((err) => {
        console.log(err);
      });
    return result;
  } catch (err) {
    console.error("image is MIA", err);
  }
}
