import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { addProfile, hasSelfProfile, type Profile } from "@/lib/profile";
import { Pill, ArrowRight, ArrowLeft, Check } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [{ title: "Set up your profile — OTC&Me" }],
  }),
  component: Onboarding,
});

const CONDITIONS = [
  "Hypertension",
  "Type 2 Diabetes",
  "Asthma",
  "Heart Disease",
  "Kidney Disease",
  "Liver Disease",
  "Thyroid Disorder",
  "GERD/Acid Reflux",
];

const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

function Onboarding() {
  const navigate = useNavigate();
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
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Pill className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold text-navy">OTC&amp;Me</span>
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
        <p className="text-sm text-muted-foreground">Step {step} of 4</p>

        <div className="mt-4 rounded-2xl border bg-card p-6 shadow-sm">
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-semibold">Who are you tracking for?</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We'll personalize OTC guidance for this person.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => !selfTaken && setIsSelf(true)}
                  disabled={selfTaken}
                  className={`rounded-xl border p-5 text-left transition ${
                    isSelf === true ? "border-primary bg-primary/5" : "hover:border-primary/50"
                  } ${selfTaken ? "cursor-not-allowed opacity-50 hover:border-input" : ""}`}
                >
                  <p className="font-semibold">Myself</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selfTaken
                      ? "You already have a personal profile. Edit it in Settings."
                      : "Personal profile for your own use."}
                  </p>
                </button>
                <button
                  onClick={() => setIsSelf(false)}
                  className={`rounded-xl border p-5 text-left transition ${
                    isSelf === false ? "border-primary bg-primary/5" : "hover:border-primary/50"
                  }`}
                >
                  <p className="font-semibold">A loved one</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Track for a parent, child, or partner.
                  </p>
                </button>
              </div>
              {isSelf === false && (
                <div className="mt-4">
                  <Label htmlFor="loved-name">Their name</Label>
                  <Input
                    id="loved-name"
                    placeholder="e.g. Mom, Jake"
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
              <h1 className="text-2xl font-semibold">Basic info</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Helps tailor dosing guidance.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="age">Age</Label>
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
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {GENDERS.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="weight">Weight</Label>
                  <Input
                    id="weight"
                    placeholder="e.g. 150 lbs"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    placeholder={`e.g. 5'7"`}
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
              <h1 className="text-2xl font-semibold">Health background</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Select all that apply. Free-text fields are optional.
              </p>

              <div className="mt-6">
                <Label className="text-sm font-medium">Chronic conditions</Label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {CONDITIONS.map((c) => (
                    <label
                      key={c}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm hover:bg-accent"
                    >
                      <Checkbox
                        checked={conditions.includes(c)}
                        onCheckedChange={() => toggleCondition(c)}
                      />
                      {c}
                    </label>
                  ))}
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm hover:bg-accent">
                    <Checkbox checked={hasOther} onCheckedChange={(v) => setHasOther(!!v)} />
                    Other
                  </label>
                </div>
                {hasOther && (
                  <Input
                    placeholder="Describe other condition"
                    value={otherCondition}
                    onChange={(e) => setOtherCondition(e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>

              <div className="mt-5">
                <Label htmlFor="rx">Prescription medications</Label>
                <Textarea
                  id="rx"
                  placeholder="e.g. lisinopril 10mg daily"
                  value={prescriptions}
                  onChange={(e) => setPrescriptions(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="mt-4">
                <Label htmlFor="allergies">Known allergies</Label>
                <Textarea
                  id="allergies"
                  placeholder="e.g. penicillin, sulfa, NSAIDs"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="mt-4">
                <Label htmlFor="home">
                  Medicines you currently have at home{" "}
                  <span className="text-xs text-muted-foreground">(Optional)</span>
                </Label>
                <Textarea
                  id="home"
                  placeholder="e.g. Tylenol, Claritin"
                  value={homeMeds}
                  onChange={(e) => setHomeMeds(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h1 className="text-2xl font-semibold">Looks good?</h1>
              <p className="mt-2 text-sm text-muted-foreground">Review and save your profile.</p>
              <dl className="mt-6 grid gap-3 text-sm">
                <Row label="Name" value={finalName} />
                <Row label="Age" value={age || "—"} />
                <Row label="Gender" value={gender} />
                <Row label="Weight" value={weight || "—"} />
                <Row label="Height" value={height || "—"} />
                <Row
                  label="Conditions"
                  value={
                    [...conditions, hasOther ? otherCondition : ""].filter(Boolean).join(", ") ||
                    "None"
                  }
                />
                <Row label="Prescriptions" value={prescriptions || "None"} />
                <Row label="Allergies" value={allergies || "None"} />
                <Row label="At home" value={homeMeds || "None"} />
              </dl>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {step < 4 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={save}>
                <Check className="h-4 w-4" /> Save profile
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
