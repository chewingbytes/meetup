import express from "express";
import { supabase } from "../../db/supabaseClient.js";

const router = express.Router();

// POST /api/waitlist
router.post("/", async (req, res) => {
    try {
        const { email, communities } = req.body as { email?: string; communities?: string[] };

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        if (!email.toLowerCase().endsWith(".edu.sg")) {
            return res.status(400).json({ message: "Email must be a .edu.sg school email" });
        }

        let waitlistId;
        const { data, error } = await supabase
            .from("waitlist_submissions")
            .insert({ email })
            .select("id")
            .maybeSingle();

        if (error) {
            if (error.code === "23505") {
                const { data: existingData, error: lookupError } = await supabase
                    .from("waitlist_submissions")
                    .select("id")
                    .eq("email", email)
                    .single();
                
                if (lookupError) throw lookupError;
                waitlistId = existingData.id;
            } else {
                throw error;
            }
        } else {
            waitlistId = data?.id; // New Submissions
        }

        // 2. Insert any communities they selected or typed out, avoiding duplicates
        if (communities && Array.isArray(communities) && communities.length > 0) {
            // Normalise and deduplicate incoming community names within this request
            const normalizedCommunities = Array.from(
                new Set(
                    communities
                        .map((c) => c?.trim())
                        .filter((c): c is string => Boolean(c))
                )
            );

            if (normalizedCommunities.length > 0) {
                // Fetch existing communities for this waitlist entry
                const { data: existingCommunities, error: existingError } = await supabase
                    .from("waitlist_communities")
                    .select("community_name")
                    .eq("waitlist_id", waitlistId);

                if (existingError) throw existingError;

                const existingSet = new Set(
                    (existingCommunities || []).map((row: any) => row.community_name)
                );

                const communityInsertions = normalizedCommunities
                    .filter((name) => !existingSet.has(name))
                    .map((comm) => ({
                        waitlist_id: waitlistId,
                        community_name: comm,
                    }));

                if (communityInsertions.length > 0) {
                    const { error: commError } = await supabase
                        .from("waitlist_communities")
                        .insert(communityInsertions);

                    if (commError) throw commError;
                }
            }
        }

        return res.status(201).json({ message: "Waitlist submission saved" });
    } catch (err: any) {
        console.error("Error saving waitlist submission:", err);
        return res
            .status(500)
            .json({ message: err.message || "Failed to save waitlist submission" });
    }
});

export default router;