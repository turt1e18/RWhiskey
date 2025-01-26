/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
export default function MainRouterButton(props: any) {
  const { text, route } = props;
  return (
    <div className="max-w-[440px] w-full py-3.5 text-base font-medium border border-white text-white inline-flex items-center bg-[#000000]/40 hover:bg-[#000000]/65 focus:outline-none rounded-lg justify-center text-center cursor-pointer">
      {text}
    </div>
  );
}
