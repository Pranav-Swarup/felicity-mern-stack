import { connectDB } from "./config/db.js";
import { Organizer, Event, Registration, Participant } from "./models/index.js";
import { hashPassword } from "./utils/password.js";
import { generateTicketId } from "./utils/generate.js";
function d(iso) { return new Date(iso); }

// ── organizer definitions ────────────────────────────────────────────
// Password: all organizers get the same easy-to-remember password
const ORG_PASSWORD = "organizer123";

const ORGANIZERS = [
    {
        organizerName: "Chess Club",
        category: "Sports",
        email: "chess-club@clubs.iiit.ac.in",
        contactEmail: "chess@felicity.iiit.ac.in",
        description: "Official Chess Club of IIIT Hyderabad",
    },
    {
        organizerName: "LitClub",
        category: "Literary",
        email: "litclub@clubs.iiit.ac.in",
        contactEmail: "litclub@felicity.iiit.ac.in",
        description: "Literary & Cultural Club of IIIT Hyderabad",
    },
    {
        organizerName: "Pentaprism",
        category: "Cultural",
        email: "pentaprism@clubs.iiit.ac.in",
        contactEmail: "pentaprism@felicity.iiit.ac.in",
        description: "Arts & Photography Club of IIIT Hyderabad",
    },
    {
        organizerName: "ASEC",
        category: "Sports",
        email: "asec@clubs.iiit.ac.in",
        contactEmail: "asec@felicity.iiit.ac.in",
        description: "Sports & Adventure Club of IIIT Hyderabad",
    },
    {
        organizerName: "TDC",
        category: "Cultural",
        email: "tdc@clubs.iiit.ac.in",
        contactEmail: "tdc@felicity.iiit.ac.in",
        description: "The Dance Club — Performing Arts at IIIT Hyderabad",
    },
    {
        organizerName: "Queer Collective",
        category: "Social",
        email: "queer-collective@clubs.iiit.ac.in",
        contactEmail: "queer@felicity.iiit.ac.in",
        description: "Social & Cultural collective at IIIT Hyderabad",
    },
    {
        organizerName: "Adventure Group",
        category: "Other",
        email: "adventure-group@clubs.iiit.ac.in",
        contactEmail: "adventure@felicity.iiit.ac.in",
        description: "Adventure & Gaming group at IIIT Hyderabad",
    },
    {
        organizerName: "TVRQC",
        category: "Other",
        email: "tvrqc@clubs.iiit.ac.in",
        contactEmail: "tvrqc@felicity.iiit.ac.in",
        description: "Quiz & Trivia Club of IIIT Hyderabad",
    },
    {
        organizerName: "Merchandise Team",
        category: "Other",
        email: "merchandise-team@clubs.iiit.ac.in",
        contactEmail: "merch@felicity.iiit.ac.in",
        description: "Official Merchandise & Sales team for Felicity",
    },
    {
        organizerName: "OSDG",
        category: "Technical",
        email: "osdg@clubs.iiit.ac.in",
        contactEmail: "osdg@felicity.iiit.ac.in",
        description: "Open Source Developers Group — Technology & Development at IIIT Hyderabad",
    },
];

// ── event definitions ────────────────────────────────────────────────
// orgRef is the index in ORGANIZERS array (set organizerId after insert)
const EVENTS = [
    // ── 1. Chess Championship Workshop — UPCOMING ──
    {
        orgRef: 0, // Chess Club
        name: "Chess Championship Workshop",
        description:
            "A competitive chess championship workshop for all skill levels.\n\nVenue: Himalaya 2nd floor classrooms\nPrize Pool: ₹30,000",
        type: "normal",
        eligibility: "all",
        registrationDeadline: d("2026-03-25T23:59:00+05:30"),
        startDate: d("2026-03-28T09:00:00+05:30"),
        endDate: d("2026-03-28T18:00:00+05:30"),
        registrationFee: 0,
        status: "published",
        tags: ["chess", "sports", "games", "workshop", "competition"],
    },
    // ── 2. Poetry Slam Competition — UPCOMING ──
    {
        orgRef: 1, // LitClub
        name: "Poetry Slam Competition",
        description:
            "Express yourself through spoken word poetry. Open mic rounds followed by competitive slams.\n\nVenue: H105\nPrize Pool: ₹10,000",
        type: "normal",
        eligibility: "all",
        registrationDeadline: d("2026-03-24T23:59:00+05:30"),
        startDate: d("2026-03-27T16:00:00+05:30"),
        endDate: d("2026-03-27T20:00:00+05:30"),
        registrationFee: 0,
        status: "published",
        tags: ["poetry", "literary", "cultural", "slam", "spoken-word"],
    },
    // ── 3. Photography Workshop — UPCOMING ──
    {
        orgRef: 2, // Pentaprism
        name: "Photography Workshop",
        description:
            "Hands-on photography workshop covering composition, lighting, and post-processing.\n\nVenue: SH2\nPrize Pool: ₹5,000",
        type: "normal",
        eligibility: "all",
        registrationDeadline: d("2026-03-26T23:59:00+05:30"),
        startDate: d("2026-03-29T10:00:00+05:30"),
        endDate: d("2026-03-29T17:00:00+05:30"),
        registrationFee: 0,
        status: "published",
        tags: ["photography", "arts", "workshop", "creative"],
    },
    // ── 4. Fitness Bootcamp — ONGOING ──
    {
        orgRef: 3, // ASEC
        name: "Fitness Bootcamp",
        description:
            "An intensive fitness bootcamp with circuit training, cardio, and team challenges.\n\nVenue: Football Ground\nPrize Pool: ₹7,800",
        type: "normal",
        eligibility: "all",
        registrationDeadline: d("2026-03-10T23:59:00+05:30"),
        startDate: d("2026-03-12T06:00:00+05:30"),
        endDate: d("2026-03-20T18:00:00+05:30"),
        registrationFee: 0,
        status: "ongoing",
        tags: ["fitness", "sports", "bootcamp", "adventure"],
    },
    // ── 5. Solo Dance Performance — ONGOING ──
    {
        orgRef: 4, // TDC
        name: "Solo Dance Performance",
        description:
            "Showcase your solo dance talent across multiple genres — classical, contemporary, hip-hop & more.\n\nVenue: Alumni Lounge\nPrize Pool: ₹70,000",
        type: "normal",
        eligibility: "all",
        registrationDeadline: d("2026-03-10T23:59:00+05:30"),
        startDate: d("2026-03-14T17:00:00+05:30"),
        endDate: d("2026-03-19T21:00:00+05:30"),
        registrationFee: 0,
        status: "ongoing",
        tags: ["dance", "performing-arts", "solo", "competition"],
    },
    // ── 6. Social Mixer Event — UPCOMING ──
    {
        orgRef: 5, // Queer Collective
        name: "Social Mixer Event",
        description:
            "A casual social mixer for the campus community. Icebreakers, conversations, and fun activities.\n\nVenue: H103, H104\nPrize Pool: None",
        type: "normal",
        eligibility: "all",
        registrationDeadline: d("2026-03-25T23:59:00+05:30"),
        startDate: d("2026-03-28T17:00:00+05:30"),
        endDate: d("2026-03-28T21:00:00+05:30"),
        registrationFee: 0,
        status: "published",
        tags: ["social", "cultural", "mixer", "community"],
    },
    // ── 7. Adventure Escape Room — COMPLETED ──
    {
        orgRef: 6, // Adventure Group
        name: "Adventure Escape Room",
        description:
            "Solve puzzles and escape the room before time runs out. Multiple themed rooms available.\n\nVenue: D-101 Thub\nPrize Pool: ₹5,000",
        type: "normal",
        eligibility: "all",
        registrationDeadline: d("2026-02-20T23:59:00+05:30"),
        startDate: d("2026-02-25T10:00:00+05:30"),
        endDate: d("2026-02-25T18:00:00+05:30"),
        registrationFee: 0,
        status: "completed",
        tags: ["adventure", "gaming", "escape-room", "puzzle"],
    },
    // ── 8. Solo Quiz Competition — COMPLETED ──
    {
        orgRef: 7, // TVRQC
        name: "Solo Quiz Competition",
        description:
            "Test your knowledge across science, history, pop culture, and more in this solo quiz showdown.\n\nVenue: KRB Auditorium\nPrize Pool: ₹17,500",
        type: "normal",
        eligibility: "all",
        registrationDeadline: d("2026-02-28T23:59:00+05:30"),
        startDate: d("2026-03-05T14:00:00+05:30"),
        endDate: d("2026-03-05T19:00:00+05:30"),
        registrationFee: 0,
        status: "completed",
        tags: ["quiz", "trivia", "competition", "knowledge"],
    },
    // ── 9. DISCO GORGON T-Shirt — UPCOMING (Merchandise) ──
    {
        orgRef: 8, // Merchandise Team
        name: "DISCO GORGON T-Shirt",
        description:
            "IIIT Hyderabad — Disco Gorgon Premium 220 GSM Oversize T-Shirt.\n\nVariants: Sizes S/M/L/XL/XXL · Colors Black/Navy Blue/Maroon\nStock: 100 units (20 per size)\nPurchase Limit: 2 per participant",
        type: "merchandise",
        eligibility: "all",
        registrationDeadline: d("2026-04-15T23:59:00+05:30"),
        startDate: d("2026-03-17T00:00:00+05:30"),
        endDate: d("2026-04-15T23:59:00+05:30"),
        registrationFee: 450,
        status: "published",
        tags: ["merchandise", "tshirt", "disco-gorgon"],
        merchDetails: {
            purchaseLimitPerParticipant: 2,
            variants: buildTshirtVariants(["Black", "Navy Blue", "Maroon"]),
        },
    },
    // ── 10. PENGUIN Premium T-Shirt — UPCOMING (Merchandise) ──
    {
        orgRef: 8, // Merchandise Team
        name: "PENGUIN Premium T-Shirt",
        description:
            "IIIT Hyderabad — Penguin Premium T-Shirt.\n\nVariants: Sizes S/M/L/XL/XXL · Colors White/Black/Grey\nStock: 100 units (20 per size)\nPurchase Limit: 2 per participant",
        type: "merchandise",
        eligibility: "all",
        registrationDeadline: d("2026-04-15T23:59:00+05:30"),
        startDate: d("2026-03-17T00:00:00+05:30"),
        endDate: d("2026-04-15T23:59:00+05:30"),
        registrationFee: 399,
        status: "published",
        tags: ["merchandise", "tshirt", "penguin"],
        merchDetails: {
            purchaseLimitPerParticipant: 2,
            variants: buildTshirtVariants(["White", "Black", "Grey"]),
        },
    },
    // ── 11. FRIED MAGGI T-Shirt — UPCOMING (Merchandise) ──
    {
        orgRef: 8, // Merchandise Team
        name: "FRIED MAGGI T-Shirt",
        description:
            "IIIT Hyderabad — Fried Maggi Premium 220 GSM Oversize T-Shirt.\n\nVariants: Sizes S/M/L/XL/XXL · Colors Yellow/Orange/Red\nStock: 100 units (20 per size)\nPurchase Limit: 2 per participant",
        type: "merchandise",
        eligibility: "all",
        registrationDeadline: d("2026-04-15T23:59:00+05:30"),
        startDate: d("2026-03-17T00:00:00+05:30"),
        endDate: d("2026-04-15T23:59:00+05:30"),
        registrationFee: 450,
        status: "published",
        tags: ["merchandise", "tshirt", "fried-maggi"],
        merchDetails: {
            purchaseLimitPerParticipant: 2,
            variants: buildTshirtVariants(["Yellow", "Orange", "Red"]),
        },
    },
];

// helper to build merch variants for t-shirts
function buildTshirtVariants(colors) {
    const sizes = ["S", "M", "L", "XL", "XXL"];
    const variants = [];
    for (const color of colors) {
        for (const size of sizes) {
            variants.push({
                variantId: `${color.toLowerCase().replace(/\s+/g, "-")}-${size.toLowerCase()}`,
                label: `${color} — ${size}`,
                size,
                color,
                stock: 20,
            });
        }
    }
    return variants;
}

// ── dummy participants (for completed-event registrations) ────────────
const PARTICIPANTS = [
    { firstName: "Aarav", lastName: "Sharma", email: "aarav.sharma@students.iiit.ac.in", participantType: "iiit", college: "IIIT Hyderabad" },
    { firstName: "Priya", lastName: "Iyer", email: "priya.iyer@students.iiit.ac.in", participantType: "iiit", college: "IIIT Hyderabad" },
    { firstName: "Rahul", lastName: "Verma", email: "rahul.verma@students.iiit.ac.in", participantType: "iiit", college: "IIIT Hyderabad" },
    { firstName: "Sneha", lastName: "Reddy", email: "sneha.reddy@students.iiit.ac.in", participantType: "iiit", college: "IIIT Hyderabad" },
    { firstName: "Karthik", lastName: "Nair", email: "karthik.nair@students.iiit.ac.in", participantType: "iiit", college: "IIIT Hyderabad" },
    { firstName: "Meera", lastName: "Patel", email: "meera.patel@gmail.com", participantType: "non-iiit", college: "IIT Bombay" },
    { firstName: "Arjun", lastName: "Das", email: "arjun.das@gmail.com", participantType: "non-iiit", college: "NIT Trichy" },
    { firstName: "Divya", lastName: "Singh", email: "divya.singh@students.iiit.ac.in", participantType: "iiit", college: "IIIT Hyderabad" },
    { firstName: "Vikram", lastName: "Joshi", email: "vikram.joshi@gmail.com", participantType: "non-iiit", college: "BITS Pilani" },
    { firstName: "Ananya", lastName: "Gupta", email: "ananya.gupta@students.iiit.ac.in", participantType: "iiit", college: "IIIT Hyderabad" },
];

const PARTICIPANT_PASSWORD = "participant123";

// ── main seed function ───────────────────────────────────────────────
async function seed() {
    await connectDB();

    console.log("\n═══════════════════════════════════════════════════════");
    console.log("  Felicity — Full Data Seed");
    console.log("═══════════════════════════════════════════════════════\n");

    const hashedOrgPwd = await hashPassword(ORG_PASSWORD);
    const hashedPartPwd = await hashPassword(PARTICIPANT_PASSWORD);

    // ── 1. Create organizers ─────────────────────────────────────────
    console.log("── Creating Organizers ──");
    const orgDocs = [];
    for (const org of ORGANIZERS) {
        // skip if already exists
        const existing = await Organizer.findOne({ email: org.email });
        if (existing) {
            console.log(`  ✓ ${org.organizerName} already exists (${org.email})`);
            orgDocs.push(existing);
            continue;
        }
        const doc = await Organizer.create({
            email: org.email,
            password: hashedOrgPwd,
            organizerName: org.organizerName,
            category: org.category,
            description: org.description,
            contactEmail: org.contactEmail,
        });
        console.log(`  + Created: ${org.organizerName} → ${org.email}`);
        orgDocs.push(doc);
    }

    // ── 2. Create events ────────────────────────────────────────────
    console.log("\n── Creating Events ──");
    const eventDocs = [];
    for (const ev of EVENTS) {
        const organizerId = orgDocs[ev.orgRef]._id;
        // skip if already exists (match by name + organizer)
        const existing = await Event.findOne({ name: ev.name, organizerId });
        if (existing) {
            console.log(`  ✓ "${ev.name}" already exists`);
            eventDocs.push(existing);
            continue;
        }
        const data = {
            organizerId,
            name: ev.name,
            description: ev.description,
            type: ev.type,
            eligibility: ev.eligibility,
            registrationDeadline: ev.registrationDeadline,
            startDate: ev.startDate,
            endDate: ev.endDate,
            registrationFee: ev.registrationFee,
            status: ev.status,
            tags: ev.tags,
        };
        if (ev.type === "normal") {
            data.customForm = [];
        }
        if (ev.type === "merchandise" && ev.merchDetails) {
            data.merchDetails = ev.merchDetails;
        }
        const doc = await Event.create(data);
        console.log(`  + Created: "${ev.name}" [${ev.status.toUpperCase()}]`);
        eventDocs.push(doc);
    }

    // ── 3. Create seed participants ──────────────────────────────────
    console.log("\n── Creating Seed Participants ──");
    const partDocs = [];
    for (const p of PARTICIPANTS) {
        const existing = await Participant.findOne({ email: p.email });
        if (existing) {
            console.log(`  ✓ ${p.firstName} ${p.lastName} already exists`);
            partDocs.push(existing);
            continue;
        }
        const doc = await Participant.create({
            ...p,
            password: hashedPartPwd,
            onboardingComplete: true,
        });
        console.log(`  + Created: ${p.firstName} ${p.lastName} (${p.email})`);
        partDocs.push(doc);
    }

    // ── 4. Register participants to completed events ─────────────────
    //    Events 7 (Adventure Escape Room) and 8 (Solo Quiz Competition)
    //    need at least 5 registered participants each — we register all 10
    //    to both completed events + both ongoing events.
    console.log("\n── Creating Registrations ──");

    // indices into eventDocs: 6 = Adventure Escape Room, 7 = Solo Quiz
    // also 3 = Fitness Bootcamp (ongoing), 4 = Solo Dance Performance (ongoing)
    const eventsToRegister = [
        { idx: 6, label: "Adventure Escape Room (COMPLETED)" },
        { idx: 7, label: "Solo Quiz Competition (COMPLETED)" },
        { idx: 3, label: "Fitness Bootcamp (ONGOING)" },
        { idx: 4, label: "Solo Dance Performance (ONGOING)" },
    ];

    for (const { idx, label } of eventsToRegister) {
        const event = eventDocs[idx];
        let created = 0;
        let skipped = 0;
        // Register all 10 participants
        for (const part of partDocs) {
            const exists = await Registration.findOne({
                eventId: event._id,
                participantId: part._id,
            });
            if (exists) {
                skipped++;
                continue;
            }
            const ticketId = generateTicketId();
            await Registration.create({
                eventId: event._id,
                participantId: part._id,
                ticketId,
                qrData: JSON.stringify({
                    ticketId,
                    eventId: event._id.toString(),
                    participantId: part._id.toString(),
                }),
                status: "confirmed",
                formResponses: {},
                registeredAt: new Date(event.startDate.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days before event
            });
            created++;
        }
        // Update registration count on the event
        const totalRegs = await Registration.countDocuments({ eventId: event._id, status: "confirmed" });
        await Event.findByIdAndUpdate(event._id, { registrationCount: totalRegs });
        console.log(`  ${label}: ${created} new, ${skipped} existing → ${totalRegs} total registrations`);
    }

    // ── 5. Print summary ────────────────────────────────────────────
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("  SEED COMPLETE — Credentials Reference");
    console.log("═══════════════════════════════════════════════════════\n");

    console.log("── Organizer Credentials ──");
    console.log("  (All organizers share the same password)\n");
    for (const org of ORGANIZERS) {
        console.log(`  ${org.organizerName.padEnd(20)} │ Email: ${org.email.padEnd(40)} │ Password: ${ORG_PASSWORD}`);
    }

    console.log("\n── Participant Credentials ──");
    console.log("  (All participants share the same password)\n");
    for (const p of PARTICIPANTS) {
        console.log(`  ${(p.firstName + " " + p.lastName).padEnd(20)} │ Email: ${p.email.padEnd(40)} │ Password: ${PARTICIPANT_PASSWORD}`);
    }

    console.log("\n── Event Summary ──\n");
    for (let i = 0; i < eventDocs.length; i++) {
        const e = eventDocs[i];
        const orgName = ORGANIZERS[EVENTS[i].orgRef].organizerName;
        console.log(`  ${(i + 1).toString().padStart(2)}. ${e.name.padEnd(35)} │ ${e.status.toUpperCase().padEnd(10)} │ ${e.type.padEnd(12)} │ Organizer: ${orgName}`);
    }

    console.log("\n── Admin Credentials ──");
    console.log(`  Email: admin@felicity.com`);
    console.log(`  Password: Admin@123\n`);

    console.log("═══════════════════════════════════════════════════════\n");

    process.exit(0);
}

seed().catch((err) => {
    console.error("\n✖ Seed failed:", err);
    process.exit(1);
});