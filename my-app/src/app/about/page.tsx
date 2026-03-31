'use client';

import Image from 'next/image';
import { MapPin, Briefcase, Clock, Mail, Phone, ExternalLink, CheckCircle, GraduationCap } from 'lucide-react';

const EXPERIENCE = [
  {
    title: 'Senior Quality Analyst',
    company: 'Iksula Services Pvt. Ltd.',
    period: 'May 2025 – Present · 11 mos',
    description: 'E-commerce performance audits, AI-powered testing agents, automation framework architecture',
    current: true,
  },
  {
    title: 'QA Engineer',
    company: 'Benzy Infotech Pvt. Ltd.',
    period: 'Mar 2024 – May 2025 · 1 yr 3 mos',
    description: 'Web application testing, manual & automation testing',
    current: false,
  },
  {
    title: 'QA Analyst',
    company: 'Elsner Technologies Pvt. Ltd.',
    period: 'Aug 2022 – Mar 2024 · 1 yr 8 mos',
    description: 'Selenium WebDriver, TestNG, regression testing, CI/CD integration',
    current: false,
  },
  {
    title: 'Software Tester',
    company: 'Intelligic Software Pvt. Ltd.',
    period: 'Jan 2020 – Aug 2022 · 2 yrs 8 mos',
    description: 'Foundation in software quality assurance',
    current: false,
  },
];

const SKILLS = [
  {
    category: 'AI & Generative AI',
    items: ['LLM', 'GenAI', 'RAG', 'LangChain', 'LangGraph', 'CrewAI', 'DeepEval', 'AI Agents', 'Multi-Agent Systems', 'SKILL.md Creation'],
  },
  {
    category: 'Testing & Automation',
    items: ['Selenium WebDriver', 'TestNG', 'API Testing', 'Regression Testing', 'Performance Testing', 'Manual Testing'],
  },
  {
    category: 'Platforms',
    items: ['Magento', 'WordPress', 'Shopify'],
  },
  {
    category: 'DevOps & Tools',
    items: ['GitHub', 'Jenkins', 'Docker', 'Selenoid Grid', 'AWS', 'JIRA'],
  },
  {
    category: 'Programming & Data',
    items: ['Java', 'Python', 'SQL', 'ADF', 'Databricks', 'PySpark'],
  },
];

const CONTACTS = [
  {
    label: 'LinkedIn',
    value: '/in/yogesh-mohite',
    href: 'https://www.linkedin.com/in/yogesh-mohite/',
    iconBg: 'var(--blue-bg)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--blue-text)"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
    ),
  },
  {
    label: 'Email',
    value: 'yogesh.ybm999@gmail.com',
    href: 'mailto:yogesh.ybm999@gmail.com',
    iconBg: 'var(--green-bg)',
    icon: <Mail className="w-[18px] h-[18px]" style={{ color: 'var(--green-text)' }} strokeWidth={1.5} />,
  },
  {
    label: 'Phone',
    value: '+91 7709708993',
    href: 'tel:+917709708993',
    iconBg: 'var(--amber-bg)',
    icon: <Phone className="w-[18px] h-[18px]" style={{ color: 'var(--amber-text)' }} strokeWidth={1.5} />,
  },
  {
    label: 'GitHub',
    value: 'yogeshcodeshare',
    href: 'https://github.com/yogeshcodeshare',
    iconBg: 'color-mix(in srgb, var(--accent) 8%, transparent)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--text-muted)"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
    ),
  },
];

const STATS = [
  { value: '6+', label: 'Years Exp.' },
  { value: '4', label: 'Companies' },
  { value: '15+', label: 'Tools' },
  { value: 'ME', label: 'Education' },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60">{children}</span>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  );
}

function SkillCategoryBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.06em] mb-2.5 mt-4 first:mt-0"
      style={{ background: 'var(--blue-bg)', color: 'var(--blue-text)' }}
    >
      {children}
    </span>
  );
}

export default function AboutPage() {
  return (
    <div className="bg-background min-h-[calc(100vh-4rem)]">
      <main className="max-w-[960px] mx-auto px-6 py-10 pb-20">

        {/* ═══ HERO: Photo + Info Split ═══ */}
        <div
          className="grid overflow-hidden rounded-[20px] bg-card border border-border shadow-sm mb-7"
          style={{ gridTemplateColumns: '340px 1fr' }}
        >
          {/* Photo */}
          <div className="relative min-h-[420px]">
            <Image
              src="/yogesh-mohite.jpg"
              alt="Yogesh Mohite"
              fill
              className="object-cover object-top"
              priority
            />
          </div>

          {/* Info */}
          <div className="relative p-10 flex flex-col justify-center">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at top right, color-mix(in srgb, var(--blue-text) 6%, transparent) 0%, transparent 60%)' }}
            />
            <div className="relative z-10">
              {/* Role badge */}
              <span
                className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.04em]"
                style={{ background: 'var(--blue-bg)', color: 'var(--blue-text)' }}
              >
                <CheckCircle className="w-3 h-3" strokeWidth={2} />
                Senior Quality Analyst
              </span>

              <h1 className="text-4xl font-black tracking-[-0.04em] text-foreground mt-4 leading-tight">
                Yogesh Mohite
              </h1>
              <p className="text-base font-medium mt-2" style={{ color: 'var(--blue-text)' }}>
                QA Engineer &middot; AI Enthusiast &middot; Test Automation Engineer
              </p>

              {/* Meta */}
              <div className="flex flex-wrap gap-4 mt-4">
                <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} /> Pune, India
                </span>
                <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                  <Briefcase className="w-3.5 h-3.5" strokeWidth={1.5} /> Iksula Services Pvt. Ltd.
                </span>
                <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" strokeWidth={1.5} /> 6+ Years
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3 mt-7">
                {STATS.map(s => (
                  <div
                    key={s.label}
                    className="text-center py-3.5 px-2 rounded-xl border"
                    style={{ background: 'color-mix(in srgb, var(--accent) 5%, transparent)', borderColor: 'var(--border)' }}
                  >
                    <div className="font-mono text-2xl font-extrabold text-foreground">{s.value}</div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ CONTENT: 2-Column Grid ═══ */}
        <div className="grid grid-cols-2 gap-6">

          {/* ── LEFT COLUMN ── */}
          <div className="flex flex-col gap-6">

            {/* About */}
            <div className="bg-card border border-border rounded-2xl shadow-sm p-7">
              <SectionLabel>About</SectionLabel>
              <p className="text-sm text-foreground/80 leading-7">
                Senior Quality Analyst with 6+ years of hands-on experience in software testing, specializing in
                automation frameworks, web application testing, and <strong className="text-foreground">AI-driven quality assurance</strong>.
                Deep expertise across e-commerce platforms (Magento, Shopify, WordPress), big data pipelines, and performance engineering.
              </p>
              <p className="text-sm text-foreground/80 leading-7 mt-3.5">
                Currently building <strong className="text-foreground">PerformancePilot</strong> &mdash; an AI-powered performance audit agent
                that automates Core Web Vitals analysis using the PageSpeed Insights API, providing actionable insights through
                intelligent metric comparison and diagnostic reporting.
              </p>
              <p className="text-sm text-foreground/80 leading-7 mt-3.5">
                Passionate about leveraging <strong className="text-foreground">Generative AI, LLMs, and multi-agent systems</strong> to
                transform software testing and quality engineering workflows.
              </p>
            </div>

            {/* Experience */}
            <div className="bg-card border border-border rounded-2xl shadow-sm p-7">
              <SectionLabel>Experience</SectionLabel>
              <div className="flex flex-col gap-5">
                {EXPERIENCE.map((exp, i) => (
                  <div key={i} className="relative pl-7">
                    {/* Timeline line */}
                    {i < EXPERIENCE.length - 1 && (
                      <div className="absolute left-[7px] top-2 bottom-[-12px] w-px" style={{ background: 'var(--border)' }} />
                    )}
                    {/* Dot */}
                    <div
                      className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full border-2"
                      style={exp.current
                        ? { borderColor: 'var(--blue-text)', background: 'var(--blue-bg)', boxShadow: '0 0 0 4px color-mix(in srgb, var(--blue-text) 12%, transparent)' }
                        : { borderColor: 'var(--border)', background: 'var(--bg-card, var(--card))' }
                      }
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-bold text-foreground">{exp.title}</h3>
                        {exp.current && (
                          <span
                            className="text-[9px] font-bold uppercase px-2 py-0.5 rounded"
                            style={{ background: 'var(--blue-bg)', color: 'var(--blue-text)' }}
                          >
                            CURRENT
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] font-semibold text-muted-foreground">{exp.company}</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-0.5">{exp.period}</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-1 leading-relaxed">{exp.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="bg-card border border-border rounded-2xl shadow-sm p-7">
              <SectionLabel>Education</SectionLabel>
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'var(--indigo-bg)' }}
                >
                  <GraduationCap className="w-5 h-5" style={{ color: 'var(--indigo-text)' }} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Master of Engineering (ME)</h3>
                  <p className="text-[13px] text-muted-foreground">Mechanical Drafting CAD/CADD</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">Shivaji University &middot; 2011 &ndash; 2014</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="flex flex-col gap-6">

            {/* Skills */}
            <div className="bg-card border border-border rounded-2xl shadow-sm p-7">
              <SectionLabel>Skills &amp; Expertise</SectionLabel>
              {SKILLS.map((group, gi) => (
                <div key={gi}>
                  <SkillCategoryBadge>{group.category}</SkillCategoryBadge>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {group.items.map(skill => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-3.5 py-1 rounded-full text-[11px] font-semibold border transition-all hover:opacity-80"
                        style={{
                          background: 'color-mix(in srgb, var(--accent) 5%, transparent)',
                          borderColor: 'var(--border)',
                          color: 'var(--text-muted, var(--muted-foreground))',
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Contact */}
            <div className="bg-card border border-border rounded-2xl shadow-sm p-7">
              <SectionLabel>Contact</SectionLabel>
              <div className="flex flex-col gap-2.5">
                {CONTACTS.map(c => (
                  <a
                    key={c.label}
                    href={c.href}
                    target={c.href.startsWith('http') ? '_blank' : undefined}
                    rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-[14px] border no-underline transition-all hover:-translate-y-0.5 hover:shadow-md"
                    style={{
                      background: 'color-mix(in srgb, var(--accent) 3%, transparent)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-body, var(--foreground))',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                      style={{ background: c.iconBg }}
                    >
                      {c.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-semibold text-foreground">{c.label}</span>
                      <p className="text-[11px] text-muted-foreground/60 truncate">{c.value}</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" strokeWidth={1.5} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center py-6">
          <p className="text-xs text-muted-foreground/60">Built with Next.js, TypeScript &amp; the PageSpeed Insights API</p>
          <p className="text-[11px] text-muted-foreground/40 mt-1">PerformancePilot v1.6.0</p>
        </div>
      </main>
    </div>
  );
}
