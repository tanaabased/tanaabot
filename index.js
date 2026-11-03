import manifest from './openclaw.plugin.json' with { type: 'json' };

export default {
  id: manifest.id,
  name: manifest.name,
  description: manifest.description,
  register() {
    // Runtime hooks and services will be added in separately scoped work.
  },
};
