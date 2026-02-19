import { llmFetch } from './client';
import { apiPaths } from '../config/api.config';
import { appConfig } from '../config/app.config';

export async function generateJourneys({ idea, selectedFeatures, confirmedPersonas }) {
  const confirmed = (confirmedPersonas || []).map((p) => ({
    id: p.id,
    label: p.label,
    icon: p.icon,
    desc: p.desc,
    color: p.color,
    suggested_journeys: p.suggested_journeys || [],
  }));
  return llmFetch(apiPaths.generateJourneys, {
    idea: idea.trim(),
    selected_features: selectedFeatures || [],
    confirmed_personas: confirmed,
    steps_per_journey: appConfig.stepsPerJourney,
    journeys_per_persona: appConfig.journeysPerPersona,
  });
}
