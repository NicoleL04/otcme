import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { addProfile, hasSelfProfile, type Profile } from "@/lib/profile";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useT } from "@/lib/i18n";
import { Pill, ArrowRight, ArrowLeft, Check } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [{ title: "Set up your profile — OTC&Me" }],
  }),
  component: Onboarding,
});

const CONDITION_KEYS = [
  { val: "Hypertension", key: "cond_hypertension" },
  { val: "Type 2 Diabetes", key: "cond_diabetes2" },
  { val: "Asthma", key: "cond_asthma" },
  { val: "Heart Disease", key: "cond_heart" },
  { val: "Kidney Disease", key: "cond_kidney" },
  { val: "Liver Disease", key: "cond_liver" },
  { val: "Thyroid Disorder", key: "cond_thyroid" },
  { val: "GERD/Acid Reflux", key: "cond_gerd" },
] as const;

const GENDER_KEYS = [
  { val: "Male", key: "g_male" },
  { val: "Female", key: "g_female" },
  { val: "Other", key: "g_other" },
  { val: "Prefer not to say", key: "g_prefer_not" },
] as const;

function Onboarding() {
  const navigate = useNavigate();
  const t = useT();
  const [step, setStep] = useState(1);
  const [selfTaken, setSelfTaken] = useState(false);
  const [isSelf, setIsSelf] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [gender, setGender] = useState("Prefer not to say");
  const [conditions, setConditions] = useState<string[]>([]);
  const [otherCondition, setOtherCondition] = useState("");
  const [hasOther, setHasOther] = useState(false);
  const [prescriptions, setPrescriptions] = useState("");
  const [allergies, setAllergies] = useState("");
  const [homeMeds, setHomeMeds] = useState("");
  const [smoking, setSmoking] = useState("Never");
  const [alcohol, setAlcohol] = useState("None");
  const [drugs, setDrugs] = useState("None");

  useEffect(() => {
    const taken = hasSelfProfile();
    setSelfTaken(taken);
    if (taken) setIsSelf(false);
  }, []);



  const finalName = isSelf ? "Myself" : name.trim() || "Loved One";

  const toggleCondition = (c: string) => {
    setConditions((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const save = () => {
    const profile: Profile = {
      id: crypto.randomUUID(),
      profile_name: finalName,
      is_self: !!isSelf,
      age,
      weight,
      height,
      gender,
      conditions,
      other_condition: hasOther ? otherCondition.trim() : undefined,
      prescriptions: prescriptions.trim(),
      allergies: allergies.trim(),
      home_meds: homeMeds.trim(),
      lifestyle: {
        smoking: smoking.trim(),
        alcohol: alcohol.trim(),
        drugs: drugs.trim(),
      },
      created_at: Date.now(),
    };
    addProfile(profile);
    navigate({ to: "/" });
  };

  const canNext =
    (step === 1 && isSelf !== null && (isSelf || name.trim().length > 0)) ||
    (step === 2 && age.trim() !== "") ||
    step === 3 ||
    step === 4;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Pill className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold text-navy">OTC&amp;Me</span>
          </div>
          <LanguageSwitcher />
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center gap-2">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={`h-1.5 flex-1 rounded-full ${
                n <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{t("onb_step_of", { n: step })}</p>

        <div className="mt-4 rounded-2xl border bg-card p-6 shadow-sm">
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-semibold">{t("onb_who_title")}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("onb_who_desc")}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => !selfTaken && setIsSelf(true)}
                  disabled={selfTaken}
                  className={`rounded-xl border p-5 text-left transition ${
                    isSelf === true ? "border-primary bg-primary/5" : "hover:border-primary/50"
                  } ${selfTaken ? "cursor-not-allowed opacity-50 hover:border-input" : ""}`}
                >
                  <p className="font-semibold">{t("onb_self")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selfTaken ? t("onb_self_taken") : t("onb_self_desc")}
                  </p>
                </button>
                <button
                  onClick={() => setIsSelf(false)}
                  className={`rounded-xl border p-5 text-left transition ${
                    isSelf === false ? "border-primary bg-primary/5" : "hover:border-primary/50"
                  }`}
                >
                  <p className="font-semibold">{t("onb_loved")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("onb_loved_desc")}
                  </p>
                </button>
              </div>
              {isSelf === false && (
                <div className="mt-4">
                  <Label htmlFor="loved-name">{t("onb_their_name")}</Label>
                  <Input
                    id="loved-name"
                    placeholder={t("onb_name_placeholder")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h1 className="text-2xl font-semibold">{t("onb_basic_title")}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("onb_basic_desc")}
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="age">{t("onb_age")}</Label>
                  <Input
                    id="age"
                    type="number"
                    inputMode="numeric"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">{t("onb_gender")}</Label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {GENDER_KEYS.map((g) => (
                      <option key={g.val} value={g.val}>{t(g.key)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="weight">{t("onb_weight")}</Label>
                  <Input
                    id="weight"
                    placeholder={t("onb_weight_ph")}
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="height">{t("onb_height")}</Label>
                  <Input
                    id="height"
                    placeholder={t("onb_height_ph")}
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h1 className="text-2xl font-semibold">{t("onb_health_title")}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("onb_health_desc")}
              </p>

              <div className="mt-6">
                <Label className="text-sm font-medium">{t("onb_chronic")}</Label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {CONDITION_KEYS.map((c) => (
                    <label
                      key={c.val}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm hover:bg-accent"
                    >
                      <Checkbox
                        checked={conditions.includes(c.val)}
                        onCheckedChange={() => toggleCondition(c.val)}
                      />
                      {t(c.key)}
                    </label>
                  ))}
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm hover:bg-accent">
                    <Checkbox checked={hasOther} onCheckedChange={(v) => setHasOther(!!v)} />
                    {t("onb_other")}
                  </label>
                </div>
                {hasOther && (
                  <Input
                    placeholder={t("onb_other_ph")}
                    value={otherCondition}
                    onChange={(e) => setOtherCondition(e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>

              <div className="mt-5">
                <Label htmlFor="rx">{t("onb_rx")}</Label>
                <Textarea
                  id="rx"
                  placeholder={t("onb_rx_ph")}
                  value={prescriptions}
                  onChange={(e) => setPrescriptions(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="mt-4">
                <Label htmlFor="allergies">{t("onb_allergies")}</Label>
                <Textarea
                  id="allergies"
                  placeholder={t("onb_allergies_ph")}
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="mt-4">
                <Label htmlFor="home">
                  {t("onb_home_meds")}{" "}
                  <span className="text-xs text-muted-foreground">({t("optional")})</span>
                </Label>
                <Textarea
                  id="home"
                  placeholder={t("onb_home_meds_ph")}
                  value={homeMeds}
                  onChange={(e) => setHomeMeds(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="mt-6 rounded-lg border bg-muted/30 p-4">
                <p className="text-sm font-medium">{t("onb_lifestyle")}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("onb_lifestyle_desc")}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="smoking" className="text-xs">{t("onb_smoking")}</Label>
                    <select
                      id="smoking"
                      value={smoking}
                      onChange={(e) => setSmoking(e.target.value)}
                      className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {[
                        { val: "Never", k: "smk_never" as const },
                        { val: "Former", k: "smk_former" as const },
                        { val: "Occasional", k: "smk_occasional" as const },
                        { val: "Daily", k: "smk_daily" as const },
                      ].map((o) => (
                        <option key={o.val} value={o.val}>{t(o.k)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="alcohol" className="text-xs">{t("onb_alcohol")}</Label>
                    <select
                      id="alcohol"
                      value={alcohol}
                      onChange={(e) => setAlcohol(e.target.value)}
                      className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {[
                        { val: "None", k: "alc_none" as const },
                        { val: "Occasional (≤2/week)", k: "alc_occasional" as const },
                        { val: "Moderate (3-7/week)", k: "alc_moderate" as const },
                        { val: "Heavy (8+/week)", k: "alc_heavy" as const },
                      ].map((o) => (
                        <option key={o.val} value={o.val}>{t(o.k)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="drugs" className="text-xs">{t("onb_drugs")}</Label>
                    <Input
                      id="drugs"
                      placeholder={t("onb_drugs_ph")}
                      value={drugs}
                      onChange={(e) => setDrugs(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h1 className="text-2xl font-semibold">{t("onb_review_title")}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t("onb_review_desc")}</p>
              <dl className="mt-6 grid gap-3 text-sm">
                <Row label={t("sum_name")} value={finalName} />
                <Row label={t("onb_age")} value={age || "—"} />
                <Row label={t("onb_gender")} value={gender} />
                <Row label={t("onb_weight")} value={weight || "—"} />
                <Row label={t("onb_height")} value={height || "—"} />
                <Row
                  label={t("onb_chronic")}
                  value={
                    [...conditions, hasOther ? otherCondition : ""].filter(Boolean).join(", ") ||
                    t("none")
                  }
                />
                <Row label={t("onb_rx")} value={prescriptions || t("none")} />
                <Row label={t("onb_allergies")} value={allergies || t("none")} />
                <Row label={t("home_at_home")} value={homeMeds || t("none")} />
                <Row label={t("onb_smoking")} value={smoking} />
                <Row label={t("onb_alcohol")} value={alcohol} />
                <Row label={t("onb_drugs")} value={drugs || t("none")} />
              </dl>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              <ArrowLeft className="h-4 w-4" /> {t("back")}
            </Button>
            {step < 4 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
                {t("continue")} <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={save}>
                <Check className="h-4 w-4" /> {t("onb_save_profile")}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b pb-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-navy">{value}</dd>
    </div>
  );
}
