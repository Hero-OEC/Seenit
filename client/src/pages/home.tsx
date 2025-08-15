import Header from "@/components/header";
import Hero from "@/components/hero";
import QuickStats from "@/components/quick-stats";
import CategoryTabs from "@/components/category-tabs";
import ContentGrid from "@/components/content-grid";
import PersonalLists from "@/components/personal-lists";
import StreamingPlatforms from "@/components/streaming-platforms";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-retro-bg">
      <Header />
      <Hero />
      <QuickStats />
      <CategoryTabs />
      <ContentGrid />
      <PersonalLists />
      <StreamingPlatforms />
      <Footer />
    </div>
  );
}
