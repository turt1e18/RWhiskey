import axios from "axios";

const ACCESS_KEY = process.env.NEXT_PUBLIC_GOOGLESEARCH_ACCESS_KEY;
const ACCESS_KEY2 = process.env.NEXT_PUBLIC_GOOGLESEARCHID_ACCESS_KEY;

export async function customSearchApi(name?: string) {
  if (!ACCESS_KEY) {
    console.log({
      err: "API key is MIA"
    });
  }

  try {
    console.log(name);
    const result = await axios
      .get("https://customsearch.googleapis.com/customsearch/v1", {
        params: {
          q: name,
          searchType: "image",
          num: 1,
          key: ACCESS_KEY,
          cx: ACCESS_KEY2
        }
      })
      .then((res) => {
        return res.data.items[0].link;
      })
      .catch((err) => {
        console.log(err);
      });
    return result;
  } catch (err) {
    console.error("image is MIA", err);
  }
}
