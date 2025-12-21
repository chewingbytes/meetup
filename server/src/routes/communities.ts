import express from "express";
import { supabase } from "../../db/supabaseClient.js";
import { upload } from "../../middleware/upload.ts";

const router = express.Router();

// Helper: ensure topic names in topics table, return ids
async function ensureTopics(names: string[]) {
  if (!names || names.length === 0) return [];
  // Insert missing ones using upsert logic: insert all and on conflict do nothing
  const inserts = names.map((n) => ({ name: n }));
  await supabase.from("topics").insert(inserts).onConflict("name").ignore();
  // fetch ids
  const { data } = await supabase.from("topics").select("id,name").in("name", names);
  return data?.map((t: any) => t.id) || [];
}

router.get("/", async (req, res) => {
  try {
    const { data: communities, error } = await supabase.from("communities").select("*").order("created_at", { ascending: false });
    if (error) throw error;

    // enrich each community with topics, rules, faqs
    const enriched = await Promise.all(
      communities.map(async (c: any) => {
        const { data: ctopics } = await supabase.from("community_topics").select("topic_id").eq("community_id", c.id);
        const topicIds = (ctopics || []).map((t: any) => t.topic_id);
        const { data: topics } = await supabase.from("topics").select("name").in("id", topicIds);
        const { data: rules } = await supabase.from("community_rules").select("rule_text,position").eq("community_id", c.id).order("position");
        const { data: faq } = await supabase.from("community_faqs").select("question,answer").eq("community_id", c.id);
        return { ...c, topics: topics?.map((t: any) => t.name) || [], rules: rules?.map((r: any) => r.rule_text) || [], faq: faq || [] };
      })
    );

    res.json(enriched);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to fetch communities" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { data: community, error } = await supabase.from("communities").select("*").eq("id", id).single();
    if (error && (error as any).code !== "PGRST116") throw error;
    if (!community) return res.status(404).json({ message: "Not found" });

    const { data: ctopics } = await supabase.from("community_topics").select("topic_id").eq("community_id", id);
    const topicIds = (ctopics || []).map((t: any) => t.topic_id);
    const { data: topics } = await supabase.from("topics").select("name").in("id", topicIds);
    const { data: rules } = await supabase.from("community_rules").select("rule_text,position").eq("community_id", id).order("position");
    const { data: faq } = await supabase.from("community_faqs").select("question,answer").eq("community_id", id);

    res.json({ ...community, topics: topics?.map((t: any) => t.name) || [], rules: rules?.map((r: any) => r.rule_text) || [], faq: faq || [] });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to fetch community" });
  }
});

// Create community (supports JSON or multipart/form-data with `payload` JSON and optional `image`)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const isForm = !!req.file || !!req.body.payload;
    let payload: any;
    if (isForm && req.body.payload) {
      payload = JSON.parse(req.body.payload);
    } else {
      payload = req.body;
    }

    const { name, description, privacyMode = false, rules = [], faq = [], topics = [], ownerId } = payload;

    // image upload if present
    let profile_image_url: string | null = null;
    if (req.file) {
      const bucket = "community-images";
      const filename = `community_${Date.now()}_${req.file.originalname}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from(bucket).upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });
      if (uploadError) {
        console.warn("image upload failed", uploadError);
      } else {
        const { publicURL } = supabase.storage.from(bucket).getPublicUrl(uploadData.path);
        profile_image_url = publicURL;
      }
    }

    // ensure topics exist and get ids
    const topicIds = await ensureTopics(topics);

    // insert community
    const { data: created, error } = await supabase
      .from("communities")
      .insert({
        owner_id: ownerId || null,
        name,
        description,
        privacy_mode: !!privacyMode,
        profile_image: profile_image_url || null,
      })
      .select()
      .single();

    if (error) throw error;
    const communityId = created.id;

    // insert topics mapping
    if (topicIds.length > 0) {
      const inserts = topicIds.map((tid: number) => ({ community_id: communityId, topic_id: tid }));
      await supabase.from("community_topics").insert(inserts);
    }

    // insert rules
    if (Array.isArray(rules) && rules.length > 0) {
      const inserts = rules.map((r: string, i: number) => ({ community_id: communityId, rule_text: r, position: i }));
      await supabase.from("community_rules").insert(inserts);
    }

    // insert faqs
    if (Array.isArray(faq) && faq.length > 0) {
      const inserts = faq.map((f: any) => ({ community_id: communityId, question: f.question, answer: f.answer }));
      await supabase.from("community_faqs").insert(inserts);
    }

    res.status(201).json({ id: communityId });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to create community" });
  }
});

export default router;