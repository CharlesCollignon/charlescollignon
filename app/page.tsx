"use client";

import { Scene3D } from "@/components/scene-3d";
import { Header } from "@/components/header";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
  HoverLink,
  Magnetic,
} from "@/components/animations";
import { TextType } from "@/components/text-type";
import { motion } from "framer-motion";
import Link from "next/link";

const skills = [
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "Framer Motion",
  "Three.js",
  "Prisma",
  "shadcn/ui",
  "Mapbox",
  "Highcharts",
  "ECharts",
];

const socialLinks = [
  { name: "GitHub", href: "https://github.com/CharlesCollignon" },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/charles-collignon/" },
];

const projects = [
  {
    title: "Bitcoin Tracker",
    description: "Real-time cryptocurrency tracking dashboard",
    tech: "Next.js • React • Charts",
    link: "https://bitcoin-tracker-nine.vercel.app/",
    image: "/binance-tracker-website.png",
    hoverImage: "/binance-tracker-app.png",
  },
  {
    title: "Project 2",
    description: "Coming soon",
    tech: "Next.js • React • TypeScript",
    link: "#",
  },
  {
    title: "Project 3",
    description: "Coming soon",
    tech: "Next.js • React • TypeScript",
    link: "#",
  },
  {
    title: "Project 4",
    description: "Coming soon",
    tech: "Next.js • React • TypeScript",
    link: "#",
  },
];

export default function Home() {
  return (
    <>
      <Scene3D />
      <Header />

      <main className="relative w-full">
        {/* Hero Section */}
        <section className="flex min-h-screen flex-col items-center justify-center px-6 md:px-12 lg:px-16">
          <div className="mx-auto w-full max-w-6xl">
            <FadeIn delay={0.2}>
              <p className="mb-4 text-center text-sm font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Senior Frontend Developer & UI/UX Designer
              </p>
            </FadeIn>

            <FadeIn delay={0.4}>
              <h1 className="mb-6 text-center text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-7xl lg:text-8xl">
                Charles
                <br />
                Collignon
              </h1>
            </FadeIn>

            <div className="flex justify-center">
              <div className="max-w-xl text-center text-lg text-zinc-600 dark:text-zinc-400 md:text-xl min-h-12 flex items-center justify-center">
                <TextType
                  texts={[
                    "I craft beautiful, performant web experiences.",
                    "Focused on interaction design and cutting-edge technologies.",
                    "Building the future of web development.",
                  ]}
                  typingSpeed={75}
                  deletingSpeed={50}
                  pauseDuration={2000}
                  showCursor
                  cursorCharacter="|"
                  cursorBlinkDuration={0.7}
                  className="text-lg text-zinc-600 dark:text-zinc-400 md:text-xl"
                />
              </div>
            </div>

            <FadeIn delay={1} className="mt-12">
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Magnetic>
                  <Link
                    href="#work"
                    className="inline-flex items-center justify-center rounded-full bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    View Work
                  </Link>
                </Magnetic>
                <Magnetic>
                  <Link
                    href="#contact"
                    className="inline-flex items-center justify-center rounded-full border border-zinc-200 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800/50"
                  >
                    Get in Touch
                  </Link>
                </Magnetic>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* About Section */}
        <section
          id="about"
          className="min-h-screen w-full flex items-center justify-center px-6 md:px-12 lg:px-16"
        >
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col items-center gap-12 md:gap-16">
              <FadeIn>
                <div className="flex flex-col items-center justify-center text-center">
                  <p className="text-sm font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                    About
                  </p>
                  <h2 className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-5xl">
                    Building digital
                    <br />
                    experiences
                  </h2>
                </div>
              </FadeIn>

              {/* Skills */}
              <StaggerContainer
                className="mt-16 flex flex-wrap justify-center gap-3"
                staggerDelay={0.05}
              >
                {skills.map((skill) => (
                  <StaggerItem key={skill}>
                    <span className="inline-flex rounded-full border border-zinc-200 px-5 py-2.5 text-sm text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                      {skill}
                    </span>
                  </StaggerItem>
                ))}
              </StaggerContainer>

              <FadeIn delay={0.2}>
                <div className="flex flex-col items-center justify-center space-y-6 text-center text-zinc-600 dark:text-zinc-400 max-w-2xl">
                  <p>
                    I&apos;m a senior frontend developer and UI/UX designer with
                    a passion for creating elegant, user-centered digital
                    products. With expertise in modern web technologies, I bring
                    ideas to life through clean code and thoughtful design.
                  </p>
                  <p>
                    Currently leading frontend development and design at
                    QuantCube Technology, where I focus on building scalable
                    applications that deliver exceptional user experiences.
                  </p>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Work Section */}
        <section
          id="work"
          className="min-h-screen w-full px-6 md:px-12 lg:px-16 flex items-center justify-center"
        >
          <div className="mx-auto max-w-6xl">
            <FadeIn>
              <div className="flex flex-col items-center justify-center text-center">
                <p className="text-sm font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  Selected Work
                </p>
                <h2 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-5xl">
                  Projects
                </h2>
              </div>
            </FadeIn>

            <div className="mt-12 flex justify-center md:mt-16 w-full">
              <div className="grid gap-6 md:grid-cols-2 md:gap-8 w-full">
                {projects.map((project, i) => (
                  <FadeIn key={project.title} delay={i * 0.1}>
                    <div>
                      {/* Title and description above the block */}
                      <div className="mb-4">
                        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                          {project.title}
                        </h3>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                          {project.description}
                        </p>
                      </div>

                      {/* Project image block */}
                      <Magnetic>
                        <motion.a
                          href={project.link}
                          target={project.link !== "#" ? "_blank" : undefined}
                          rel={
                            project.link !== "#"
                              ? "noopener noreferrer"
                              : undefined
                          }
                          className="group relative aspect-video min-h-75 block cursor-pointer overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900"
                          whileHover={{ scale: 1.02 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                          }}
                        >
                          {/* Default background image */}
                          {project.image && (
                            <div
                              className="absolute inset-0 bg-cover bg-center transition-opacity duration-300 group-hover:opacity-0"
                              style={{
                                backgroundImage: `url(${project.image})`,
                              }}
                            />
                          )}

                          {/* Hover background image with scroll animation */}
                          {project.hoverImage && (
                            <div
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              style={{
                                backgroundImage: `url(${project.hoverImage})`,
                                backgroundSize: "cover",
                                backgroundPosition: "top center",
                                animation:
                                  "scroll-background 20s linear infinite",
                              }}
                            />
                          )}

                          {/* Overlay */}
                          {project.image && (
                            <div className="absolute inset-0 bg-zinc-900/40 dark:bg-zinc-950/40 transition-opacity group-hover:bg-zinc-900/20 dark:group-hover:bg-zinc-950/20" />
                          )}

                          {/* Tech stack on hover */}
                          <div className="absolute inset-0 flex items-end bg-linear-to-t from-black/80 to-transparent p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            <div className="relative z-10">
                              <h3 className="text-xl font-semibold text-white">
                                {project.title}
                              </h3>
                              <p className="mt-1 text-sm text-zinc-300">
                                {project.tech}
                              </p>
                            </div>
                          </div>
                        </motion.a>
                      </Magnetic>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section
          id="contact"
          className="min-h-screen flex items-center justify-center px-6 md:px-12 lg:px-16"
        >
          <div className="mx-auto flex gap-4 flex-col items-center text-center">
            <FadeIn>
              <div className="flex flex-col items-center justify-center text-center ">
                <p className="text-sm font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  Contact
                </p>
                <h2 className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-5xl lg:text-6xl">
                  Let&apos;s work
                  <br />
                  together
                </h2>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="mt-12 flex justify-center text-center">
                <Magnetic>
                  <a
                    href="mailto:collignoncharles@gmail.com"
                    className="text-2xl font-medium text-zinc-900 transition-colors hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-400 md:text-3xl"
                  >
                    collignoncharles@gmail.com
                  </a>
                </Magnetic>
              </div>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="mt-12 flex items-center justify-center gap-8">
                {socialLinks.map((link) => (
                  <HoverLink
                    key={link.name}
                    href={link.href}
                    external
                    className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    {link.name}
                  </HoverLink>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-100 py-8 px-6 dark:border-zinc-900 md:px-12 lg:px-16">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              © 2026 Charles Collignon. All rights reserved.
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              Built with Next.js, Three.js & Framer Motion
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
