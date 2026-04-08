import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Award, Globe, Heart } from 'lucide-react';
import { View } from '../types';

export const About = () => {
  const navigate = useNavigate();

  return (
  <main className="flex-1 min-h-screen">
    {/* Hero Section */}
    <section className="bg-gradient-to-br from-primary/10 via-white to-primary/5 py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 md:px-20">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-4 sm:mb-6">About E-Quran Academy</h1>
        <p className="text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed">
          Empowering Muslims worldwide through accessible, high-quality Quranic education and spiritual guidance in the digital age.
        </p>
      </div>
    </section>

    {/* Our Mission */}
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 md:px-20 bg-white">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8 md:mb-12 text-center">Our Mission</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-primary mb-3 sm:mb-4">Quality Education</h3>
            <p className="text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed">
              We believe every student deserves access to world-class Quranic instruction. Our platform connects learners with experienced, qualified teachers who are passionate about sharing Islamic knowledge and fostering spiritual growth.
            </p>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-primary mb-3 sm:mb-4">Global Community</h3>
            <p className="text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed">
              E-Quran Academy brings together students and teachers from around the world, creating a diverse, supportive community united by the love of learning the Quran. Distance is no barrier to education and connection.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* Why Choose Us */}
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 md:px-20 bg-slate-50">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-8 sm:mb-12 text-center">Why Choose Us?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div className="bg-white rounded-xl p-4 sm:p-6 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-primary/10 w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Award className="size-6 sm:size-7 text-primary" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2 text-sm sm:text-base">Expert Teachers</h3>
            <p className="text-xs sm:text-sm text-slate-600">Qualified instructors with years of experience in Quranic studies</p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-primary/10 w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Globe className="size-6 sm:size-7 text-primary" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2 text-sm sm:text-base">Flexible Learning</h3>
            <p className="text-xs sm:text-sm text-slate-600">Learn at your own pace with classes available at multiple times</p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-primary/10 w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Users className="size-6 sm:size-7 text-primary" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2 text-sm sm:text-base">Community</h3>
            <p className="text-xs sm:text-sm text-slate-600">Connect with students and teachers from around the world</p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-primary/10 w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Heart className="size-6 sm:size-7 text-primary" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2 text-sm sm:text-base">Personal Growth</h3>
            <p className="text-xs sm:text-sm text-slate-600">Develop spiritually and intellectually through structured curriculum</p>
          </div>
        </div>
      </div>
    </section>

    {/* Our Story */}
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 md:px-20 bg-white">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8">Our Story</h2>
        <div className="space-y-4 sm:space-y-6 text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed">
          <p>
            E-Quran Academy was founded with a simple yet profound vision: to make authentic Quranic education accessible to everyone, regardless of geographic location or background.
          </p>
          <p>
            In today's digital world, we recognized that traditional barriers to Islamic education were becoming less relevant. With the right technology and dedicated teachers, we could create a platform where students from every corner of the globe could learn the Quran from qualified instructors in an engaging, supportive environment.
          </p>
          <p>
            Since our inception, we've grown to serve thousands of students across multiple continents. We remain committed to maintaining the highest standards of Islamic education while embracing modern learning technologies.
          </p>
        </div>
      </div>
    </section>

    {/* AI-Powered Development */}
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 md:px-20 bg-slate-50">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8">AI-Powered Development</h2>
        <div className="space-y-4 sm:space-y-6 text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed">
          <p>
            This platform is proudly developed with the assistance of GitHub Copilot, an AI-powered coding assistant that enhances productivity and code quality. GitHub Copilot helps developers write better code faster by providing intelligent suggestions and automating repetitive tasks.
          </p>
          <p>
            By leveraging cutting-edge AI technology, we ensure that our platform is built efficiently, securely, and with the highest standards of software development practices.
          </p>
        </div>
      </div>
    </section>

    {/* CTA Section */}
    <section className="bg-gradient-to-r from-primary to-primary/80 py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 md:px-20 text-center text-white">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 md:mb-6">Ready to Start Your Journey?</h2>
        <p className="mb-6 sm:mb-8 md:mb-10 text-sm sm:text-base md:text-lg text-primary/90">Join thousands of students learning Quranic studies with E-Quran Academy</p>
        <button onClick={() => navigate('/role-selection')} className="bg-white text-primary px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 rounded-full font-bold hover:bg-slate-50 transition-all shadow-lg text-sm sm:text-base md:text-lg">
          Get Started Today
        </button>
      </div>
    </section>
  </main>
  );
};
