import { llmFetch } from './client';
import { apiPaths } from '../config/api.config';
import { appConfig } from '../config/app.config';

export async function generateJourneys({ idea, selectedFeatures, selectedFeatureDescriptions, confirmedPersonas }) {
  const confirmed = (confirmedPersonas || []).map((p) => ({
    id: p.id,
    label: p.label,
    icon: p.icon,
    desc: p.desc,
    color: p.color,
    suggested_journeys: p.suggested_journeys || [],
  }));
  const body = {
    idea: idea.trim(),
    selected_features: selectedFeatures || [],
    confirmed_personas: confirmed,
    steps_per_journey: appConfig.stepsPerJourney,
    journeys_per_persona: appConfig.journeysPerPersona,
  };
  if (selectedFeatureDescriptions?.length) {
    body.selected_feature_descriptions = selectedFeatureDescriptions.map(({ title, description }) => ({
      title: title || '',
      description: description ?? '',
    }));
  }
  return llmFetch(apiPaths.generateJourneys, body);
}
