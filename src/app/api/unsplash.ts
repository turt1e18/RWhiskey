// import axios from "axios";

// const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

// export async function randomTestImage(name?: string) {
//   if (!ACCESS_KEY) {
//     console.log({
//       err: "API key is MIA"
//     });
//   }

//   try {
//     console.log(name);
//     const result = await axios
//       .get("https://api.unsplash.com/photos/random", {
//         params: {
//           client_id: ACCESS_KEY,
//           count: 1,
//           query: "whiskey"
//         }
//       })
//       .then((res) => {
//         console.log("59", res.data[0].urls);
//         return res.data[0].urls.regular;
//       });
//     return result;
//   } catch (err) {
//     console.error("image is MIA", err);
//   }
// }
