import Head from "next/head";
import WilderProV2 from "@/components/pro/WilderProV2";

export default function ProPage() {
  return (
    <>
      <Head>
        <title>Wilder Pro</title>
        <meta
          name="description"
          content="Wilder Pro — briefs clients pour paysagistes"
        />
        <meta name="robots" content="noindex" />
      </Head>
      <WilderProV2 />
    </>
  );
}
