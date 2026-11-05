import type { BriefAnswers } from "@/lib/api";

/**
 * Brief question sets. A brief row on the API names its set by `form`; the questions live here,
 * in code, so wording can change without touching stored answers. Question ids are what the
 * answers are keyed by: never reuse an id for a different question.
 *
 *   one     pick one              many    tick all that apply
 *   yn      yes or no             text    a written answer (`long` gives it more room)
 *   date    a day, picked         file    files they attach
 *   either  typed, or files, or both
 *   note    a line to read, with no answer
 *
 * `other` names the choice that opens a text box; what is typed there is kept under `<id>.other`.
 * Files are not answers: they live in the project's files, filed against the question's id, and
 * a file question counts as answered once it holds one.
 */
export type QuestionKind = "one" | "many" | "yn" | "text" | "date" | "file" | "either" | "note";

export interface Question {
  id: string;
  kind: QuestionKind;
  text: string;
  options?: string[];
  other?: string;
  long?: boolean;
  /** What a written answer starts with, for them to fill in: "Facebook: ", "Instagram: ". */
  prefill?: string;
  /** Shown only when this holds. A hidden question is skipped, not counted as blank. */
  showIf?: (answers: BriefAnswers) => boolean;
}

export interface Section {
  title: string;
  /**
   * The part's stable name. On a needs list each part is sent on its own and tracked as a plan
   * item under this key, so it must never change once a list is out.
   */
  key?: string;
  /** The part's name on the plan, when the title reads oddly there. */
  planTitle?: string;
  /** One plain line under the title, when the section needs it. */
  note?: string;
  /**
   * Repeat this part, a copy per week for example. Each copy is its own part: key `weekly-03`,
   * title "Week 3", and its answers under `w03.<question id>`.
   */
  repeat?: { count: number; label: string; prefix: string; planTitle: (n: number) => string };
  showIf?: (answers: BriefAnswers) => boolean;
  questions: Question[];
}

export interface BriefForm {
  key: string;
  title: string;
  greeting: string;
  intro: string[];
  thanks: string;
  /**
   * "parts": a needs list. The wide page with its parts down the side, each part sent on its
   * own and tracked on the project's plan. Without it, the single-column questionnaire.
   */
  layout?: "parts";
  sections: Section[];
}

/** One part of a needs list, as the page and the plan see it, with repeats laid out. */
export interface FormPart {
  key: string;
  title: string;
  planTitle: string;
  note?: string;
  /** For a repeated part: which copy it is, of how many, under which heading. */
  repeat?: { group: string; groupTitle: string; label: string; n: number; count: number };
  /** Question ids here already carry a repeat's prefix (`w03.theme`). */
  questions: Question[];
  /** Whether there is anything to answer. A part of notes only is read, never sent. */
  tracked: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** The form's parts in order, with every repeated part laid out copy by copy. */
export function formParts(form: BriefForm): FormPart[] {
  return form.sections.flatMap((s, i): FormPart[] => {
    const key = s.key ?? `part-${i + 1}`;
    const tracked = s.questions.some((q) => q.kind !== "note");
    if (!s.repeat) {
      return [{ key, title: s.title, planTitle: s.planTitle ?? s.title, note: s.note, questions: s.questions, tracked }];
    }
    const r = s.repeat;
    return Array.from({ length: r.count }, (_, k) => {
      const n = k + 1;
      return {
        key: `${key}-${pad(n)}`,
        title: `${r.label} ${n}`,
        planTitle: r.planTitle(n),
        note: s.note,
        repeat: { group: key, groupTitle: s.title, label: r.label, n, count: r.count },
        questions: s.questions.map((q) => ({ ...q, id: `${r.prefix}${pad(n)}.${q.id}` })),
        tracked,
      };
    });
  });
}

/** What the project's plan gets: one item per part that has something to answer. */
export function trackedParts(form: BriefForm): { key: string; title: string; note: string }[] {
  return formParts(form)
    .filter((p) => p.tracked)
    .map((p) => ({
      key: p.key,
      title: p.planTitle,
      // The questions, so the plan item says what the part holds without opening the list.
      note: p.questions
        .filter((q) => q.kind !== "note")
        .map((q) => `- ${q.text.split(". ")[0].replace(/\.$/, "")}`)
        .join("\n"),
    }));
}

/** Whether an answer is, or includes, a value. */
export function has(answers: BriefAnswers, id: string, value: string): boolean {
  const answer = answers[id];
  return Array.isArray(answer) ? answer.includes(value) : answer === value;
}

export function isAnswered(answers: BriefAnswers, id: string): boolean {
  const answer = answers[id];
  if (Array.isArray(answer)) return answer.length > 0;
  return typeof answer === "string" && answer.trim() !== "";
}

/** The questions a person would see with these answers, section by section. */
export function visibleSections(form: BriefForm, answers: BriefAnswers) {
  return form.sections
    .filter((s) => !s.showIf || s.showIf(answers))
    .map((s) => ({ ...s, questions: s.questions.filter((q) => !q.showIf || q.showIf(answers)) }))
    .filter((s) => s.questions.length > 0);
}

const STOCK = "Products and stock";

const hannaBizflow: BriefForm = {
  key: "hanna-bizflow",
  title: "Questions about your system",
  greeting: "Hello Hanna,",
  intro: [
    "These questions will help us build the right system for you.",
    "Most of them take one tap. A few ask for a short answer in your own words.",
    "Your answers save as you go. You can stop and come back to this link at any time.",
    "If a question does not fit your plans, leave it blank.",
    "When you finish, press Send at the bottom.",
  ],
  thanks: "Thank you, Hanna. We have your answers.",
  sections: [
    {
      title: "You and the idea",
      questions: [
        {
          id: "A1",
          kind: "one",
          text: "What is the name of the product?",
          options: ["BizFlow OS", "Not decided yet", "Another name"],
          other: "Another name",
        },
        {
          id: "A2",
          kind: "one",
          text: "What is your role in this product?",
          options: [
            "I will own it and sell it to businesses",
            "I will use it in my own business first, then sell it",
            "I am getting it built for someone else",
            "Other",
          ],
          other: "Other",
        },
        { id: "A3", kind: "yn", text: "Will your own business use it first?" },
        {
          id: "A4",
          kind: "text",
          text: "What does your business do?",
          showIf: (a) => has(a, "A3", "Yes"),
        },
        { id: "A5", kind: "text", long: true, text: "What problem will this fix for a small business owner?" },
        {
          id: "A6",
          kind: "text",
          long: true,
          text: "Have you seen an app that is close to this? Tell us its name, and what you like or dislike about it.",
        },
      ],
    },
    {
      title: "Who will buy it",
      questions: [
        {
          id: "B1",
          kind: "one",
          text: "Your design suits a business that sells services. A shop needs stock and a till instead. Who is this product for?",
          options: ["Businesses that sell services", "Shops and businesses that keep stock", "Both", "Not sure yet"],
        },
        {
          id: "B2",
          kind: "many",
          text: "Which businesses do you want to sell to?",
          options: [
            "Shops that sell goods from stock",
            "Wholesalers and distributors",
            "Restaurants, chop bars and food vendors",
            "Agencies, studios and consultants",
            "Event, media and production houses",
            "Salons, spas and barbers",
            "Pharmacies and chemical shops",
            "Other",
          ],
          other: "Other",
        },
        { id: "B3", kind: "text", text: "If you could start with only one kind of business, which would it be?" },
        {
          id: "B4",
          kind: "one",
          text: "How many people work in a typical business you will sell to?",
          options: ["Just the owner", "2 to 5", "6 to 20", "More than 20"],
        },
        {
          id: "B5",
          kind: "many",
          text: "How do these businesses keep their records today?",
          options: [
            "Notebook or ledger",
            "Receipt books",
            "Excel or Google Sheets",
            "WhatsApp messages",
            "Another app",
            "Nothing written down",
          ],
        },
        {
          id: "B6",
          kind: "many",
          text: "Where do these businesses lose money today?",
          options: [
            "Stock goes missing",
            "Staff keep some of the cash",
            "Customers do not pay on time",
            "They cannot tell if they made a profit",
            "Stock expires or spoils",
            "Invoices are forgotten",
            "Other",
          ],
          other: "Other",
        },
        {
          id: "B7",
          kind: "many",
          text: "Which countries do you want to sell in first?",
          options: ["Ghana", "Nigeria", "Other"],
          other: "Other",
        },
        { id: "B8", kind: "yn", text: "Do you have businesses ready to try the first version?" },
        {
          id: "B9",
          kind: "text",
          text: "How many, and what kind of businesses are they?",
          showIf: (a) => has(a, "B8", "Yes"),
        },
      ],
    },
    {
      title: "What it must do",
      questions: [
        {
          id: "C1",
          kind: "many",
          text: "Tick every part the first version must have.",
          options: [
            "Customer list",
            STOCK,
            "Sales at the counter (the till)",
            "Quotes, invoices and receipts",
            "Proposals",
            "Payments and money owed",
            "Expenses and bills",
            "Money set aside for tax or savings",
            "Bookings calendar",
            "Jobs that move through stages",
            "Staff logins and roles",
            "Suppliers and purchases",
            "Reports",
            "Files and documents",
            "A page where the business's own customers log in",
          ],
        },
        { id: "C2", kind: "text", text: "If we could build only one part first, which would it be?" },
        { id: "C3", kind: "text", text: "Which parts can wait for a later version?" },
      ],
    },
    {
      title: "Stock",
      note: "These questions are about businesses that keep stock.",
      // Asked unless she has said the product is for service businesses only and left stock off.
      showIf: (a) => !(has(a, "B1", "Businesses that sell services") && !has(a, "C1", STOCK)),
      questions: [
        {
          id: "D1",
          kind: "one",
          text: "How many different products does a typical business keep?",
          options: ["Under 50", "50 to 500", "500 to 5,000", "More than 5,000"],
        },
        { id: "D2", kind: "yn", text: "Do the products come in sizes, colours or other types?" },
        { id: "D3", kind: "yn", text: "Do they sell the same item by the carton and by the piece?" },
        { id: "D4", kind: "yn", text: "Do any of their products expire?" },
        { id: "D5", kind: "yn", text: "Should the system warn the owner when stock is running low?" },
        { id: "D6", kind: "yn", text: "Do they buy stock from suppliers on credit?" },
        { id: "D7", kind: "yn", text: "Should the system record the orders they send to suppliers?" },
        {
          id: "D8",
          kind: "one",
          text: "How many shops or store rooms does a typical business have?",
          options: ["One", "Two or three", "More than three"],
        },
        {
          id: "D9",
          kind: "yn",
          text: "Should staff be able to move stock from one shop to another in the system?",
          showIf: (a) => has(a, "D8", "Two or three") || has(a, "D8", "More than three"),
        },
        {
          id: "D10",
          kind: "one",
          text: "How should staff find an item when they sell it?",
          options: [
            "Scan its barcode with a scanner",
            "Scan its barcode with the phone camera",
            "Search for it by name",
            "A mix of these",
          ],
        },
        {
          id: "D11",
          kind: "yn",
          text: "Should the system show the profit on each item, using its cost price and selling price?",
        },
      ],
    },
    {
      title: "Selling and payment",
      questions: [
        { id: "E1", kind: "yn", text: "Will staff record sales at a counter?" },
        {
          id: "E2",
          kind: "many",
          text: "How do their customers pay?",
          options: ["Cash", "MTN MoMo", "Telecel Cash", "AT Money", "Card", "Bank transfer", "On credit, to pay later"],
        },
        { id: "E3", kind: "yn", text: "Should customers be able to pay through a link, by MoMo or card?" },
        { id: "E4", kind: "yn", text: "Do customers sometimes pay in parts?" },
        { id: "E5", kind: "yn", text: "Should the system print receipts on a small receipt printer?" },
        {
          id: "E6",
          kind: "one",
          text: "Who should be allowed to give a customer a discount?",
          options: ["Any staff member", "Only the owner or a manager", "Nobody"],
        },
        {
          id: "E7",
          kind: "yn",
          text: "At closing time, should the cashier count the cash, and the system check it against the day's sales?",
        },
      ],
    },
    {
      title: "Invoices and receipts",
      questions: [
        {
          id: "F1",
          kind: "many",
          text: "Which documents does a business need?",
          options: [
            "Quote",
            "Proforma invoice",
            "Invoice",
            "Receipt",
            "Proposal",
            "Delivery note or waybill",
            "Statement of account",
          ],
        },
        {
          id: "F2",
          kind: "yn",
          text: "You asked for invoices and receipts to go out on their own after payment. Should the owner be able to turn this off for some customers?",
        },
        {
          id: "F3",
          kind: "many",
          text: "How should invoices and receipts reach the customer?",
          options: ["Email", "WhatsApp", "SMS with a link", "Printed and handed over"],
        },
        {
          id: "F4",
          kind: "one",
          text: "Every WhatsApp or SMS message costs money to send. Who should pay for it?",
          options: [
            "It is part of the monthly price",
            "The business buys message credits",
            "The business sends from its own WhatsApp",
            "Not sure",
          ],
        },
        { id: "F5", kind: "yn", text: "Should the system remind customers who still owe money?" },
        { id: "F6", kind: "yn", text: "Should each business put its own logo and colours on its documents?" },
        { id: "F7", kind: "yn", text: "Should each document carry a QR code that proves it is real?" },
        {
          id: "F8",
          kind: "one",
          text: "Which tax should invoices show?",
          options: ["VAT and the levies", "No tax", "Each business chooses", "Not sure"],
        },
      ],
    },
    {
      title: "Staff and control",
      questions: [
        {
          id: "G1",
          kind: "many",
          text: "Which staff roles does a business need?",
          options: ["Owner", "Manager", "Cashier", "Store keeper", "Accountant", "Sales rep"],
        },
        {
          id: "G2",
          kind: "one",
          text: "You asked for every invoice to show on the home page with its date and time. Who should see that list?",
          options: ["The owner only", "The owner and managers", "All staff"],
        },
        {
          id: "G3",
          kind: "one",
          text: "Should anyone be able to delete a sale or an invoice?",
          options: ["No. It can only be cancelled, with a reason", "Only the owner", "Any staff member"],
        },
        { id: "G4", kind: "yn", text: "Should the system keep a record of who changed what, and when?" },
        {
          id: "G5",
          kind: "one",
          text: "How should the owner hear about money coming in?",
          options: ["A message for every payment", "One summary each evening", "Only for large amounts", "No messages"],
        },
        { id: "G6", kind: "yn", text: "Should one owner be able to run two or more businesses from one login?" },
      ],
    },
    {
      title: "Bookings and jobs",
      questions: [
        { id: "H1", kind: "yn", text: "Do the businesses you have in mind take bookings?" },
        {
          id: "H2",
          kind: "many",
          text: "You asked for a production calendar that fills with each month's bookings. What gets booked?",
          options: ["Customer appointments", "Jobs or shoots", "Staff time", "Equipment or rooms", "Deliveries"],
          showIf: (a) => has(a, "H1", "Yes"),
        },
        {
          id: "H3",
          kind: "yn",
          text: "Should customers be able to book for themselves through a link?",
          showIf: (a) => has(a, "H1", "Yes"),
        },
        {
          id: "H4",
          kind: "yn",
          text: "Should a booking take a deposit?",
          showIf: (a) => has(a, "H1", "Yes"),
        },
        {
          id: "H5",
          kind: "yn",
          text: "In your design, a draft invoice is made when a job moves to Delivered. Should it work that way?",
        },
      ],
    },
    {
      title: "The home page and money",
      questions: [
        {
          id: "I1",
          kind: "many",
          text: "Which figures must the home page show?",
          options: [
            "Cash collected this month",
            "Sales today",
            "Money owed",
            "Overdue payments",
            "Expenses this month",
            "Profit",
            "Value of stock",
            "Items running low",
            "Money set aside",
          ],
        },
        {
          id: "I2",
          kind: "yn",
          text: "Your design puts 20% of every payment aside in a Tax Vault. Should each business choose its own rate?",
        },
        {
          id: "I3",
          kind: "yn",
          text: "Your design tracks the business's own monthly costs, like data and software. Should we keep that page?",
        },
        {
          id: "I4",
          kind: "many",
          text: "Which currencies must the system handle?",
          options: ["GHS", "NGN", "USD", "GBP", "EUR"],
        },
        {
          id: "I5",
          kind: "one",
          text: "Where should exchange rates come from?",
          options: ["The owner types the rate", "The system fetches the day's rate", "Both"],
        },
        { id: "I6", kind: "yn", text: "Should reports download as Excel or PDF for the accountant?" },
      ],
    },
    {
      title: "Phones, laptops and internet",
      questions: [
        {
          id: "J1",
          kind: "one",
          text: "What will most businesses use it on?",
          options: ["An Android phone", "A laptop or desktop", "Both", "A tablet"],
        },
        {
          id: "J2",
          kind: "one",
          text: "Your design mentions Offline Mode. What should happen when the internet goes off?",
          options: [
            "Everything keeps working and catches up later",
            "Sales keep working and the rest waits",
            "It needs the internet, and that is fine",
          ],
        },
        {
          id: "J3",
          kind: "text",
          text: "You want it to run well on entry-level laptops. What is the cheapest laptop or phone it must work on?",
        },
        {
          id: "J4",
          kind: "many",
          text: "How should people get the system?",
          options: ["From the Play Store", "Open it in the browser", "Install it on Windows", "Not sure"],
        },
      ],
    },
    {
      title: "Price and selling",
      questions: [
        {
          id: "K1",
          kind: "one",
          text: "How will businesses pay for it?",
          options: ["Monthly", "Yearly", "Pay once", "Pay once, then a small monthly fee"],
        },
        {
          id: "K2",
          kind: "one",
          text: "Your notes mention a free plan for 2 clients. What should the free plan be?",
          options: [
            "Free up to a set number of customers",
            "Free up to a set number of invoices or sales",
            "Free for a trial period",
            "No free plan",
          ],
        },
        {
          id: "K3",
          kind: "one",
          text: "What should the smallest paid plan cost each month?",
          options: ["Under GHS 100", "GHS 100 to 250", "GHS 250 to 500", "Above GHS 500", "Not sure"],
        },
        {
          id: "K4",
          kind: "many",
          text: "What should move a business to a bigger plan?",
          options: ["More staff", "More shops", "More products", "More invoices", "Extra parts like bookings or WhatsApp"],
        },
        {
          id: "K5",
          kind: "text",
          long: true,
          text: "Your notes ask why a business would keep paying, instead of downloading its records once and leaving. What is your answer?",
        },
        { id: "K6", kind: "yn", text: "Should a business be able to download all its records and leave?" },
        {
          id: "K7",
          kind: "many",
          text: "Who will sell the system to businesses?",
          options: ["You", "Sales agents on commission", "Online adverts", "Accountants and other partners"],
        },
        {
          id: "K8",
          kind: "one",
          text: "Who will help businesses when they get stuck?",
          options: ["You", "Your staff", "SaharaBase", "Not decided"],
        },
      ],
    },
    {
      title: "Time, money and ownership",
      questions: [
        {
          id: "L1",
          kind: "one",
          text: "When do you want the first version working in a real business?",
          options: ["Within 1 month", "In 1 to 3 months", "In 3 to 6 months", "No fixed date"],
        },
        { id: "L2", kind: "text", text: "What budget have you set for the first version? A range is fine." },
        {
          id: "L3",
          kind: "one",
          text: "Who will own the code and the name?",
          options: ["You", "SaharaBase, with a licence to you", "Shared", "Let us discuss it"],
        },
        {
          id: "L4",
          kind: "one",
          text: "Who will pay the running costs after launch, like hosting, SMS and WhatsApp?",
          options: ["You", "It comes out of the subscriptions", "Shared", "Let us discuss it"],
        },
        { id: "L5", kind: "yn", text: "Do you have a logo and a web address for it?" },
        { id: "L6", kind: "text", long: true, text: "Is there anything we have not asked that matters to you?" },
      ],
    },
  ],
};

/**
 * The Ghana Student Awards needs list (fee BIL-GSA-63, accepted 4 Nov 2026), for Evergreen Events
 * & Production. Copied from the list the owner shaped on a claude.ai page (artifact
 * LybkrQJW13B8S5JWE6KRi2, db version 20), keeping each item’s id and words. Sponsors, past photos,
 * speakers and the programme were file only there, but they also ask for names or a link, so here
 * they take typed words too. Part keys and
 * question ids are what the plan and the saved answers are keyed by: never reuse one for
 * something else. A new part added here reaches a list already out with "Update the plan" on the
 * project page.
 */
const gsaCampaign: BriefForm = {
  key: "gsa-campaign",
  title: "What we need from you",
  greeting: "Hello,",
  intro: [
    "Thank you for signing our contract.",
    "To do the work, we need some things from you. They are all on this page, in parts.",
    "Fill in a part when you have it. Then press Send for that part.",
    "Your answers save as you type. You can stop and come back to this link at any time.",
    "Some parts come later. You do not need them now.",
  ],
  thanks: "Send each part when you have it. Thank you.",
  layout: "parts",
  sections: [
    {
      key: "start",
      title: "To start",
      questions: [
        { id: "pay1", kind: "note", text: "Your fee is GHS 7,000. You pay it once, in full, by 5 January 2027. You do not pay anything now." },
      ],
    },
    {
      key: "brand",
      title: "For your logo and colours",
      planTitle: "Logo and colours",
      questions: [
        { id: "name", kind: "text", text: "The full name of the awards and the year. Write it exactly how it should look." },
        { id: "colours", kind: "text", text: "Colours you like. Also colours you do not want.", long: true },
        { id: "likes", kind: "file", text: "Pictures of designs or logos you like from other events. Screenshots are fine." },
        { id: "handles", kind: "text", text: "Your social media names. Write your username next to each one. If you do not use one, leave it empty. We will put them on the designs.", long: true, prefill: "Facebook: \nInstagram: \nTikTok: \nX (Twitter): \nYouTube: \nLinkedIn: " },
        { id: "contact", kind: "text", text: "Your phone number and email. We will put them on the designs too." },
      ],
    },
    {
      key: "partners",
      title: "Sponsors and partners",
      planTitle: "Sponsors and partners",
      questions: [
        { id: "sponsors", kind: "either", text: "The names and logos of your sponsors and partners. Include your partner schools. Send the real logo files. Do not send screenshots." },
        { id: "sponsorlock", kind: "note", text: "Send the full list before we start the designs. After that, we will not add new sponsors or partners to any design. This is part of our contract." },
        { id: "partnerphotos", kind: "file", text: "Photos of your sponsors and partner schools, if you have them. For example, their buildings, their people or past events." },
      ],
    },
    {
      key: "website",
      title: "For the website",
      planTitle: "Website",
      questions: [
        { id: "address", kind: "text", text: "The website name you want. For example, ghanastudentawards.com." },
        { id: "hosting", kind: "yn", text: "Buy the website name and the hosting. Hosting is the space where the website lives. We will tell you which ones to buy. Then give us the logins for both: the website name account and the hosting account. Send the logins to us privately on WhatsApp. Do not type passwords on this form." },
        { id: "template", kind: "file", text: "Fill in our website template. We will send it to you. It shows every page of the website. For each part, it says what words we need. When you finish, send it back to us." },
        { id: "voting", kind: "text", text: "The link to your voting system. Also the name and phone number of your engineer. Your engineers join voting to the website, so we need to work with them." },
        { id: "pastphotos", kind: "either", text: "Photos from past awards, if you have any. You can also send a link to them, like a Google Drive link." },
      ],
    },
    {
      key: "nominations",
      title: "For the nominees",
      planTitle: "Nominees",
      questions: [
        { id: "categories", kind: "either", text: "The full list of award categories. There are about 50. Spell each one correctly. You can type them here or send a file." },
        { id: "nomopen", kind: "date", text: "When do nominations open?" },
        { id: "nomclose", kind: "date", text: "When do nominations close?" },
        { id: "voteopen", kind: "date", text: "When does voting open?" },
        { id: "voteclose", kind: "date", text: "When does voting close?" },
        { id: "night", kind: "text", text: "The date, time and place of the awards night. If you do not know yet, tell us when you will know." },
        { id: "howvote", kind: "text", text: "Explain how nominating and voting work, step by step. We want to understand the whole process. Also send the link, the short code, and the price of one vote.", long: true },
        { id: "nomlist", kind: "file", text: "One full list of nominees, taken from your voting system. For each one, send the full name, school, category and a clear photo. Send it at least 1 week before voting opens." },
      ],
    },
    {
      key: "weekly",
      title: "Every week, for 13 weeks",
      note: "Each week, fill in this part for that week’s 3 posts. We will send you a filled-in sample first. We make the graphics from what you write. Then we send them back, and your team posts them.",
      repeat: { count: 13, label: "Week", prefix: "w", planTitle: (n) => `Week ${n} posts` },
      questions: [
        { id: "theme", kind: "text", text: "The theme for the week. What is this week about? For example, nominations are open, or meet the judges." },
        { id: "direction", kind: "text", text: "The direction for the week. What should people feel or do after they see the posts?", long: true },
        { id: "post1", kind: "text", text: "Picture post 1. Write the headline, the short words under it, and the call to action. The call to action tells people what to do, like Vote now.", long: true },
        { id: "post2", kind: "text", text: "Picture post 2. Write the headline, the short words under it, and the call to action.", long: true },
        { id: "video", kind: "text", text: "Animated video. Write the words for each part of the video, in order. End with the call to action.", long: true },
        { id: "imagery", kind: "either", text: "The pictures for the posts. Send the photos you want us to use. Or tell us the kind of picture you want, like students on stage, a trophy or a school." },
        { id: "posts", kind: "note", text: "Send this part 1 week before that week starts." },
      ],
    },
    {
      key: "thenight",
      title: "For the awards night",
      planTitle: "Awards night",
      questions: [
        { id: "speakers", kind: "either", text: "The speakers and special guests. Up to 10 people. For each one, send the full name, their title, and a clear photo. We also show these names on the screen when they speak." },
        { id: "sizes", kind: "either", text: "The exact size of each print item. Give the width and the height. Say if it is in feet, inches or centimetres. Your printer can tell you. Say what each backdrop is for, like the stage or the photo wall. For each flag, also say the type, like teardrop or feather.", prefill: "Backdrop 1: \nBackdrop 2: \nBackdrop 3: \nBackdrop 4: \nPull up banner 1: \nPull up banner 2: \nPull up banner 3: \nPull up banner 4: \nFlag 1: \nFlag 2: \nFlag 3: " },
        { id: "counts", kind: "text", text: "How many invitations, tickets and name tags do you need?" },
        { id: "tickets", kind: "text", text: "Do you sell tickets? If yes, what types are there? What does each one cost?", long: true },
        { id: "nametags", kind: "text", text: "The names to print on the name tags.", long: true },
        { id: "programme", kind: "either", text: "For the programme booklet: the order of events with times, and the name of the MC. Also send any messages from the organisers, with their photos." },
        { id: "screen", kind: "text", text: "The size of the stage screen. Ask the screen company for the width and height." },
        { id: "clips", kind: "file", text: "Video clips from your videographer. Send the ones you want in the opening video and the promo videos." },
      ],
    },
    {
      key: "winners",
      title: "When the winners are known",
      planTitle: "Winners",
      note: "You do not need to send these now. They come later, when the winners are known.",
      questions: [
        { id: "winnerlist", kind: "file", text: "The list of all 50 winners, with name, school and category. Send it at least 1 week before the night. We need time to print the certificates." },
        { id: "signers", kind: "text", text: "The names and titles of the people who will sign the certificates.", long: true },
        { id: "signatures", kind: "file", text: "The signature of each person who signs. Sign in black pen on clean white paper. Then send a clear photo or scan." },
      ],
    },
    {
      key: "after",
      title: "After the awards night",
      planTitle: "After the awards night",
      note: "You do not need to send these now. Send them after the awards night.",
      questions: [
        { id: "nightphotos", kind: "file", text: "Photos from the night. We use them for the thank you graphics." },
        { id: "thanks", kind: "text", text: "The names of the people and groups you want to thank.", long: true },
      ],
    },
    {
      key: "twosites",
      title: "If you want the two other websites",
      planTitle: "The two other websites",
      questions: [
        { id: "pay2", kind: "note", text: "Pay the full GHS 5,500 for both websites. We start when it is paid." },
        { id: "siteneeds", kind: "file", text: "The sites are for the Ghana Energy Awards and the Ghana Industrialisation Week. For each site, send the same things as in the website part above. Fill in one website template for each site. Also send each site's logo." },
      ],
    },
  ],
};

const FORMS: Record<string, BriefForm> = {
  [hannaBizflow.key]: hannaBizflow,
  [gsaCampaign.key]: gsaCampaign,
};

/** The forms a project’s needs list can be made from. */
export const NEEDS_LIST_FORMS: { key: string; label: string }[] = [
  { key: gsaCampaign.key, label: "Ghana Student Awards campaign" },
];

export function briefForm(key: string): BriefForm | null {
  return FORMS[key] ?? null;
}
