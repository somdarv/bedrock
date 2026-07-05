'use client'

import React, { useRef } from 'react';
import html2pdf from 'html2pdf.js';

export default function page() {
    const proposalRef = useRef();

    const handleDownloadPDF = () => {
        const element = proposalRef.current;
        const opt = {
            margin: [0.5, 0.0],
            filename: 'Robert_Kampilaari_Digital_Management_SAH-BD-PRO-AUG20252.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                backgroundColor: null
            },
            jsPDF: {
                unit: 'in',
                format: 'a4',
                orientation: 'portrait'
            }
        };

        html2pdf().set(opt).from(element).save();
    };

    return (
        <div>
            {/* Download Button */}
            <div className="max-w-3xl mx-auto mb-4">
                <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                >
                    {/* ... (keep same button SVG and styling) */}
                    Download PDF
                </button>
            </div>

            <div ref={proposalRef} className="max-w-3xl p-8 mx-auto rounded-lg shadow-lg bg-primary/5">
                <p className='my-2 text-xs'>SAH-BD-20250809-PRO-43-8x4eff2b3c78e6f9g-182501742503@saharabasetech.com</p>

                <div className="flex items-start justify-between p-4 mb-8 rounded-lg bg-primary/10">
                    <div>
                        <h1 className='mb-4 text-5xl text-black text-uptown'>Saharabase Technologies</h1>
                        <p className="text-sm text-gray-600">17 Alhaji Sulley Road,</p>
                        <p className="text-sm text-gray-600">Abelemkpe, Accra</p>
                        <p className="text-sm text-gray-600">contact@saharabasetech.com</p>
                        <p className="my-2 text-sm text-gray-600">www.saharabasetech.com</p>
                    </div>
                    <div className="text-right w-44">
                        <h2 className="mb-2 text-3xl font-bold text-gray-800">PROPOSAL</h2>
                        <p className="text-sm text-gray-600">Proposal #: AUG20252</p>
                        <p className="text-sm text-gray-600">Issue Date: AUG 09, 2025</p>
                        <p className="text-sm text-gray-600">Valid Until: SEPT 09, 2025</p>
                    </div>
                </div>

                <div className='flex items-start justify-between'>
                    <div className="mb-8">
                        <h3 className="mb-2 font-semibold text-gray-600">Proposed To:</h3>
                        <p className="font-semibold text-gray-800">Mr. Robert Kampilaari</p>
                        <p className="text-sm text-gray-600">Director, National Youth Authority, North East Region</p>
                        <p className="text-sm text-gray-600">CEO, Think Global Consults</p>
                    </div>
                </div>

                {/* subject */}
                <div className='flex items-end h-96 mt-44'>
                    <p className='w-[70%] text-2xl'><span className='font-semibold'>Subject:
                    </span> January 27th: How We Can Make Sure It Never Happens Again</p>
                </div>

                <div className='mt-44'>
                    <div className='my-8 font-semibold text-md'>Remember That Facebook Post?</div>

                    <p className='my-2 text-sm'>
                        January 27, 2025, 11:13 AM: You posted congratulations to Edmond Kombat for becoming TOR Managing Director.
                        <br /><br />
                        Within hours, every major news outlet in Ghana was running the story: 3news, GhanaWeb, Modern Ghana, GBC Online. Your post got 240 reactions, 89 comments, and triggered nationwide coverage.
                        <br /><br />
                        But here's the problem: the appointment wasn't real. When TOR announced Dr. Yussif Sulemana as the actual Managing Director weeks later, GhanaFact traced the whole mess back to your original Facebook post.
                        <br /><br />
                        The Fact remains: Your single Facebook post accidentally created a national news crisis.
                    </p>

                    <div className='my-8 font-semibold text-md'>Here's the problem</div>

                    <p className='my-2 text-sm'>
                        When you were just running Think Global Consults and Dream Big Foundation, this might have been embarrassing. But now you're the North East Region National Youth Authority Director.
                        <br /><br />
                        Everything is different.
                        <br /><br />
                        <span className='font-medium'>Your Posts Are Being Watched</span>
                        <br />
                        Opposition politicians are screenshotting everything you post
                        <br />
                        Journalists are fact-checking your social media
                        <br />
                        GhanaFact proved they're tracking your posts as news sources
                        <br />
                        Every mistake now reflects on the government that appointed you
                        <br /><br />
                        <span className='font-medium'>Your Career Is On The Line</span>
                        <br />
                        Future political appointments depend on having a clean communication record
                        <br />
                        One more incident like the TOR post could end your government career
                        <br />
                        Your reputation now affects that of the entire National Youth Authority
                    </p>

                    <div className='my-8 font-semibold text-md'>The Stakes Are Higher Now</div>

                    <p className='my-2 text-sm'>
                        Your influence is proven (that post reached the whole country)
                        <br />
                        But with government position comes government responsibility
                        <br />
                        Amateur social media management is now a career killer
                        <br /><br />
                        Real talk: The same influence that got you here could destroy everything if we don't handle it right.
                    </p>

                    <div className='my-8 font-semibold text-md'>What We Need To Fix (And Fast)</div>

                    <p className='my-2 text-sm'>
                        <span className='font-medium'>Problem #1: You're Flying Blind on Social Media</span>
                    </p>
                    <ul className='mx-6'>
                        <li className='my-2 text-sm'>No plan for when your posts go viral unexpectedly</li>
                        <li className='my-2 text-sm'>No separation between your personal opinions and your government role</li>
                    </ul>
                    <p className='my-2 text-sm'>
                        <span className='font-medium'>The Fix:</span> Social media management system with fact-checking protocols, content approval workflows, and crisis response plans. Never another TOR incident.
                    </p>

                    <p className='my-4 text-sm'>
                        <span className='font-medium'>Problem #2: Your Professional Image Is All Over The Place</span>
                    </p>
                    <ul className='mx-6'>
                        <li className='my-2 text-sm'>Different profile pictures across Facebook, LinkedIn, and other platforms</li>
                        <li className='my-2 text-sm'>Job descriptions don't match. Some say CEO, others say different titles</li>
                        <li className='my-2 text-sm'>LinkedIn profile doesn't even mention your NYA Director appointment</li>
                        <li className='my-2 text-sm'>No proper website connecting all your roles</li>
                        <li className='my-2 text-sm'>People don't know if you're speaking as CEO, Foundation Director, or NYA Director</li>
                    </ul>
                    <p className='my-2 text-sm'>
                        <span className='font-medium'>The Fix:</span> Professional brand consistency package: same professional photos, updated job titles, matching descriptions across all platforms. This makes you look organized and like you have a professional team managing your brand.
                    </p>

                    <p className='my-4 text-sm'>
                        <span className='font-medium'>Problem #3: You're Leaving Money on the Table</span>
                    </p>
                    <ul className='mx-6'>
                        <li className='my-2 text-sm'>You're giving away expertise that people would pay for</li>
                        <li className='my-2 text-sm'>No system to sell courses or premium mentorship</li>
                        <li className='my-2 text-sm'>Missing opportunities to build real wealth from your knowledge</li>
                    </ul>
                    <p className='my-2 text-sm'>
                        <span className='font-medium'>The Fix:</span> Professional online course platform and monetization system. Turn your proven expertise into steady monthly income through courses, coaching, and premium content.
                    </p>

                    <p className='my-4 text-sm'>
                        <span className='font-medium'>Problem #5: Your Events Need Professional Management</span>
                    </p>
                    <ul className='mx-6'>
                        <li className='my-2 text-sm'>You're organizing the Tamale Youth Summit this year</li>
                        <li className='my-2 text-sm'>No professional system for ticket sales and event management</li>
                        <li className='my-2 text-sm'>Information scattered across different platforms</li>
                        <li className='my-2 text-sm'>Registration process probably handled manually (WhatsApp Group)</li>
                    </ul>
                    <p className='my-2 text-sm'>
                        <span className='font-medium'>The Fix:</span> Integrated event management system on your website. Professional ticketing, automated registration, attendee communication, and event promotion all in one place. Makes you look like the organized leader you are.
                    </p>

                    <p className='my-4 text-sm'>
                        When the TOR thing happened, what was your response strategy?
                    </p>
                    <ul className='mx-6'>
                        <li className='my-2 text-sm'>No templates for handling controversy</li>
                        <li className='my-2 text-sm'>No team to help manage your reputation</li>
                    </ul>
                    <p className='my-2 text-sm'>
                        <span className='font-medium'>The Fix:</span> Complete crisis management system with response templates, monitoring tools, and professional team backup. When problems arise, you'll handle them like the leader you are.
                    </p>

                    <div className='my-8 font-semibold text-md'>Here's How We Fix All This</div>

                    <p className='my-2 text-sm'>
                        <span className='font-medium'>Step 1: Build You a Proper Website</span>
                        <br />
                        One Professional Home for Everything: robertkampilaari.com
                    </p>

                    <p className='my-4 text-sm'>
                        <span className='font-medium'>What You'll Get:</span>
                    </p>
                    <ul className='mx-6'>
                        <li className='my-2 text-sm'>Clean, professional look that screams "government official"</li>
                        <li className='my-2 text-sm'>Clear separation of your different roles with consistent branding</li>
                        <li className='my-2 text-sm'>Online course platform where you can sell your knowledge</li>
                        <li className='my-2 text-sm'>Event management system for your Tamale Youth Summit: ticket sales, registration, attendee communication, all automated</li>
                        <li className='my-2 text-sm'>Blog where you can share ideas safely</li>
                        <li className='my-2 text-sm'>Booking system for speaking events</li>
                        <li className='my-2 text-sm'>Professional photo gallery and brand assets with the same look across all platforms</li>
                    </ul>

                    <p className='my-4 text-sm'>
                        <span className='font-medium'>The Political Safety Features:</span>
                    </p>
                    <ul className='mx-6'>
                        <li className='my-2 text-sm'>Disclaimer showing when you're speaking personally vs officially</li>
                        <li className='my-2 text-sm'>Security features that protect you from hackers</li>
                        <li className='my-2 text-sm'>Content approval system before anything goes live</li>
                        <li className='my-2 text-sm'>Crisis management tools for when things go wrong</li>
                    </ul>

                    <p className='my-4 text-sm'>
                        <span className='font-medium'>Step 2: Fix Your Social Media</span>
                    </p>

                    <div className='mx-6'>
                        <p className='my-4 text-sm'>
                            <span className='font-medium'>Facebook (Your Main Platform: Needs Emergency Fixes)</span>
                        </p>
                        <ul className='mx-6'>
                            <li className='my-2 text-sm'>Crisis templates: Ready responses when things go viral</li>
                            <li className='my-2 text-sm'>Content calendar: Plan posts instead of random sharing</li>
                            <li className='my-2 text-sm'>Government guidelines: Make sure everything meets official standards</li>
                        </ul>

                        <p className='my-4 text-sm'>
                            <span className='font-medium'>LinkedIn (Professional Makeover Needed)</span>
                        </p>
                        <ul className='mx-6'>
                            <li className='my-2 text-sm'>Complete profile overhaul: add your NYA Director role, update all job descriptions</li>
                            <li className='my-2 text-sm'>Professional headshots that match your other platforms</li>
                            <li className='my-2 text-sm'>Regular articles showing your expertise in youth development and Northern Ghana issues</li>
                            <li className='my-2 text-sm'>Network with other government officials and business leaders</li>
                            <li className='my-2 text-sm'>Consistent messaging across all your professional platforms</li>
                        </ul>

                        <p className='my-4 text-sm'>
                            <span className='font-medium'>Twitter/X (For Official Communication)</span>
                        </p>
                        <ul className='mx-6'>
                            <li className='my-2 text-sm'>Professional updates about government work</li>
                            <li className='my-2 text-sm'>Careful engagement with political topics</li>
                            <li className='my-2 text-sm'>Platform for policy discussions</li>
                        </ul>
                    </div>

                    <div className='my-8 font-semibold text-md'>The Bigger Picture: Looking Like The Leader You Are</div>

                    <p className='my-2 text-sm'>
                        When everything is consistent and professional across all platforms, people see you differently. They see someone who:
                    </p>
                    <ul className='mx-6'>
                        <li className='my-2 text-sm'>Has a professional team managing their brand</li>
                        <li className='my-2 text-sm'>Pays attention to details that matter</li>
                        <li className='my-2 text-sm'>Takes their reputation seriously</li>
                        <li className='my-2 text-sm'>Is organized and systematic in everything they do</li>
                        <li className='my-2 text-sm'>Commands respect from colleagues and the public</li>
                    </ul>

                    <p className='my-2 text-sm'>
                        Right now, your scattered online presence makes you look like you're handling everything yourself. Once we fix this, you'll look like the serious leader with proper support that you actually are.
                        <br /><br />
                        Your Tamale Youth Summit becomes a case study. Instead of manual registration and scattered information, you'll have a professional event management system that handles everything smoothly. Attendees will see this level of organization and think "This guy really has his act together."
                    </p>

                    <div className='my-8 font-semibold text-md'>Step 3: Turn Your Knowledge Into Money</div>

                    <ul className='mx-6'>
                        <li className='my-2 text-sm'>"How to Start a Business in Northern Ghana"</li>
                        <li className='my-2 text-sm'>"Youth Leadership Secrets"</li>
                        <li className='my-2 text-sm'>"Making Smart Decisions" (based on your "Indecision is a Killer" expertise)</li>
                        <li className='my-2 text-sm'>"Building Success in Tough Times"</li>
                    </ul>

                    <p className='my-4 text-sm'>
                        <span className='font-medium'>Set Up Paid Mentorship:</span>
                    </p>
                    <ul className='mx-6'>
                        <li className='my-2 text-sm'>Group coaching sessions</li>
                        <li className='my-2 text-sm'>One-on-one mentorship programs</li>
                        <li className='my-2 text-sm'>VIP access packages</li>
                        <li className='my-2 text-sm'>Success tracking for your clients</li>
                    </ul>

                    <div className='my-8 font-semibold text-md'>Step 4: Never Have Another Crisis (Ongoing)</div>

                    <p className='my-2 text-sm'>
                        <span className='font-medium'>Crisis Prevention:</span>
                    </p>
                    <ul className='mx-6'>
                        <li className='my-2 text-sm'>Templates ready for different types of problems</li>
                        <li className='my-2 text-sm'>Team monitoring what people say about you online</li>
                        <li className='my-2 text-sm'>Regular reports on your reputation</li>
                    </ul>

                    <p className='my-4 text-sm'>
                        <span className='font-medium'>Performance Tracking:</span>
                    </p>
                    <ul className='mx-6'>
                        <li className='my-2 text-sm'>See which content works best</li>
                        <li className='my-2 text-sm'>Track how many people visit your website</li>
                        <li className='my-2 text-sm'>Monitor course sales and student success</li>
                        <li className='my-2 text-sm'>Measure your influence growth</li>
                    </ul>

                    <div className='my-8 font-semibold text-md'>How We'll Work Together</div>

                    <p className='my-2 text-sm'>
                        <span className='font-medium'>What Our Team Handles:</span>
                    </p>
                    <ul className='mx-6'>
                        <li className='my-2 text-sm'>Building and maintaining your website</li>
                        <li className='my-2 text-sm'>Creating your social media strategy</li>
                        <li className='my-2 text-sm'>Setting up your course platform</li>
                        <li className='my-2 text-sm'>Managing crises when they happen</li>
                        <li className='my-2 text-sm'>Tracking your results</li>
                    </ul>

                    <p className='my-4 text-sm'>
                        <span className='font-medium'>What You Handle:</span>
                    </p>
                    <ul className='mx-6'>
                        <li className='my-2 text-sm'>Creating the actual content (with our guidance)</li>
                        <li className='my-2 text-sm'>Providing local insights and connections</li>
                        <li className='my-2 text-sm'>Making final decisions on political content</li>
                        <li className='my-2 text-sm'>Using your existing relationships</li>
                    </ul>

                    <p className='my-4 text-sm'>
                        <span className='font-medium'>Your Designer:</span>
                    </p>
                    <ul className='mx-6'>
                        <li className='my-2 text-sm'>Option 1: We work directly with your designer to keep your brand consistent</li>
                        <li className='my-2 text-sm'>Option 2: We handle the technical stuff, your designer does the creative work</li>
                        <li className='my-2 text-sm'>Option 3: Mix and match: we do some, they do some</li>
                    </ul>

                    <div className='my-8 font-semibold text-md'>What This Could Make You</div>

                    <p className='my-2 text-sm'>
                        <span className='font-medium'>Money You Could Earn:</span>
                        <br />
                        Year 1 Realistic Goals:
                    </p>
                    <ul className='mx-6'>
                        <li className='my-2 text-sm'>Online Courses: recurring income on course/book sales</li>
                        <li className='my-2 text-sm'>Speaking Events: 25% more bookings with professional website</li>
                        <li className='my-2 text-sm'>Consulting Work: Higher rates because of better credibility</li>
                        <li className='my-2 text-sm'>Political Growth: Better communication helps career advancement</li>
                    </ul>

                    <p className='my-4 text-sm'>
                        <span className='font-medium'>What You Really Get:</span>
                    </p>
                    <ul className='mx-6'>
                        <li className='my-2 text-sm'>Protection: No more TOR-type incidents</li>
                        <li className='my-2 text-sm'>Credibility: Government-level professional image</li>
                        <li className='my-2 text-sm'>Growth: Systems that work even when you're busy</li>
                        <li className='my-2 text-sm'>Legacy: Platform that lasts throughout your career</li>
                    </ul>

                    <div className='my-8 font-semibold text-md'>Why We Need to Start Now</div>

                    <p className='my-2 text-sm'>
                        <span className='font-medium'>Time Is Running Out</span>
                        <br />
                        The TOR incident is still fresh. People remember it. We can frame this as you learning and growing, but only if we act fast. Wait too long, and if another incident happens, it looks like a pattern of poor judgment.
                        <br /><br />

                        <span className='font-medium'>Northern Ghana Needs This</span>
                        <br />
                        You're one of the few leaders from the region with real digital influence. Done right, you become THE voice for Northern Ghana development. Done wrong, you become a cautionary tale.
                        <br /><br />

                        <span className='font-medium'>Your Government Position Demands It</span>
                        <br />
                        Every day you're NYA Director without professional digital management is a day you're risking your career. Opposition parties are watching. Media is watching. You need to be bulletproof.
                    </p>

                    <div className='my-8 font-semibold text-md'>The Bottom Line</div>

                    <p className='my-2 text-sm'>
                        Robert, January 27th was a warning shot.
                        <br /><br />
                        Your Facebook post proved two things: you have massive influence, and you need professional help managing it. As NYA Director, you can't afford another incident like the TOR post.
                        <br /><br />
                        This isn't about fancy websites or social media tricks. This is about protecting the career you've built while turning your knowledge into real money.
                        <br /><br />
                        The question is simple: Do you want to keep gambling with amateur social media management, or do you want bulletproof systems that protect and grow your influence?
                        <br /><br />
                        Every day without professional management is another day of unnecessary risk.
                        <br /><br />
                        Let's talk. Let's fix this. Let's make you untouchable.
                    </p>

                    <div className='my-8 font-semibold text-md'>Taking the Next Step Together</div>

                    <p className='my-2 text-sm'>
                        To solidify our partnership and move forward with protecting Robert Kampilaari's digital presence and government career, the most productive next step is to schedule a detailed consultation.
                        <br /><br />
                        To make this happen, please let us know what days and times work best for your team to meet next week. We are flexible and can accommodate your schedule. We can meet either in person or virtually, whichever is most convenient for you.
                        <br /><br />
                        Please reply to this email or reach us directly on <a className='font-bold underline' rel="noopener noreferrer" target='_blank' href="https://wa.me/233509886584">WhatsApp</a> to schedule our consultation.
                    </p>
                </div>

                {/* Approval Section */}
                <div className="flex items-center justify-between pt-6 mt-8 border-t border-gray-300">
                    <div className="text-xs text-gray-600">
                        <p>Prepared by: Business Developement</p>
                        <p>Approved by: Julitta Adanuse</p>
                        <p>Position: Business Development Manager</p>
                        <p>Employee ID: SAH-BD-2020-07</p>
                    </div>
                    <div className="text-xs text-gray-500">
                        <p>Document ID: SAH-BD-20250809-PRO-43</p>
                        <p>Generated on System: SAH-CRM-PRO-2025</p>
                        <p>Timestamp: 2025-08-09T14:30:00Z</p>
                    </div>
                </div>
            </div>
        </div>
    )
}