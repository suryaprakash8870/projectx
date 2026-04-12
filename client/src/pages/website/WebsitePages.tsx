import Hero from '../../components/website/Hero';
import TrustSection from '../../components/website/TrustSection';
import HowItWorks from '../../components/website/HowItWorks';
import Ecosystem from '../../components/website/Ecosystem';
import QRCashback from '../../components/website/QRCashback';
import ReferralNetwork from '../../components/website/ReferralNetwork';
import MerchantSection from '../../components/website/MerchantSection';
import WhyChoose from '../../components/website/WhyChoose';
import Testimonials from '../../components/website/Testimonials';
import CTA from '../../components/website/CTA';
import Marketplace from '../../components/website/Marketplace';
import FAQ from '../../components/website/FAQ';
import { Navigate, useSearchParams } from 'react-router-dom';

export function HomePage() {
  const [searchParams] = useSearchParams();
  // Preserve referral links: /?ref=X&leg=Y → /login?ref=X&leg=Y
  const ref = searchParams.get('ref');
  if (ref) {
    const leg = searchParams.get('leg');
    return <Navigate to={`/login?ref=${ref}${leg ? `&leg=${leg}` : ''}`} replace />;
  }

  return (
    <>
      <Hero />
      <TrustSection />
      <HowItWorks />
      <Ecosystem />
      <QRCashback />
      <ReferralNetwork />
      <MerchantSection />
      <WhyChoose />
      <Testimonials />
      <CTA />
    </>
  );
}

export function HowItWorksPage() {
  return (
    <div className="pt-20">
      <HowItWorks />
      <QRCashback />
      <CTA />
    </div>
  );
}

export function FeaturesPage() {
  return (
    <div className="pt-20">
      <Ecosystem />
      <Marketplace />
      <ReferralNetwork />
      <WhyChoose />
      <CTA />
    </div>
  );
}

export function ShopsPage() {
  return (
    <div className="pt-20">
      <MerchantSection />
      <CTA />
    </div>
  );
}

export function FAQPage() {
  return (
    <div className="pt-20">
      <FAQ />
      <CTA />
    </div>
  );
}
