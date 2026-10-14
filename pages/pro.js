import Head from "next/head";
import WilderProV2 from "@/components/pro/WilderProV2";

export default function ProPage() {
  return (
    <>
      <Head>
        <title>Sevya Pro</title>
        <meta
          name="description"
          content="Sevya Pro — briefs clients pour paysagistes"
        />
        <meta name="robots" content="noindex" />
      </Head>
      <WilderProV2 />
    </>
  );
}
