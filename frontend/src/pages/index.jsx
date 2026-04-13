import Navbar from '../components/shared/Navbar'
import HeroSection from '../components/discover/HeroSection'
import EducationSection from '../components/discover/EducationSection'
import ExampleGallery from '../components/discover/ExampleGallery'
import IdeaFuel from '../components/discover/IdeaFuel'
import Footer from '../components/discover/Footer'

export default function DiscoverPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <EducationSection />
        <ExampleGallery />
        <IdeaFuel />
      </main>
      <Footer />
    </div>
  )
}
