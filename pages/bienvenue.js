/** Alias historique : redirige vers la page d'entrée `/`. */
export default function BienvenueRedirectPage() {
  return null;
}

export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/",
      permanent: false,
    },
  };
}
