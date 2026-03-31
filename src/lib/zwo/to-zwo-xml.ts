import { ZwoStep, ZwoWorkout } from "@/lib/zwo/types";

function escapeXml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
}

function toStepXml(step: ZwoStep): string {
    switch (step.type) {
        case "Warmup":
            return `<Warmup Duration="${step.Duration}" PowerLow="${step.PowerLow.toFixed(2)}" PowerHigh="${step.PowerHigh.toFixed(2)}" />`;
        case "Cooldown":
            return `<Cooldown Duration="${step.Duration}" PowerLow="${step.PowerLow.toFixed(2)}" PowerHigh="${step.PowerHigh.toFixed(2)}" />`;
        case "SteadyState":
            return `<SteadyState Duration="${step.Duration}" Power="${step.Power.toFixed(2)}" />`;
        case "Ramp":
            return `<Ramp Duration="${step.Duration}" PowerLow="${step.PowerLow.toFixed(2)}" PowerHigh="${step.PowerHigh.toFixed(2)}" />`;
        case "IntervalsT":
            return `<IntervalsT Repeat="${step.Repeat}" OnDuration="${step.OnDuration}" OffDuration="${step.OffDuration}" OnPower="${step.OnPower.toFixed(2)}" OffPower="${step.OffPower.toFixed(2)}" />`;
        case "TextEvent":
            return `<TextEvent timeoffset="${step.timeoffset}" message="${escapeXml(step.message)}" />`;
        default:
            return "";
    }
}

export function toZwoXml(workout: ZwoWorkout): string {
    const tagsXml =
        workout.tags.length > 0
            ? `\n  <tags>\n${workout.tags
                  .map(tag => `    <tag name="${escapeXml(tag)}" />`)
                  .join("\n")}\n  </tags>`
            : "";
    const stepsXml = workout.steps.map(step => `    ${toStepXml(step)}`).join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>${escapeXml(workout.author)}</author>
  <name>${escapeXml(workout.name)}</name>
  <description>${escapeXml(workout.description)}</description>
  <sportType>${workout.sportType}</sportType>${tagsXml}
  <workout>
${stepsXml}
  </workout>
</workout_file>
`;
}
