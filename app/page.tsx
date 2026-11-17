import Translator from "../components/translator";

export default function Home() {
  return <Translator contactEmail={process.env.CONTACT_EMAIL || "elcankarimli08@gmail.com"} />;
}
