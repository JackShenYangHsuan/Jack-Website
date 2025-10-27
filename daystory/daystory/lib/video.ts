interface MockVideoAsset {
  url: string;
  thumbnailUrl?: string;
}

const DEFAULT_VIDEO: MockVideoAsset = {
  url: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
  thumbnailUrl: "https://dummyimage.com/800x450/1e3a8a/ffffff.png&text=DayStory+Preview",
};

const CHARACTER_VIDEO_MAP: Record<string, MockVideoAsset> = {
  "adventurous-explorer": {
    url: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
    thumbnailUrl: "https://dummyimage.com/800x450/2563eb/ffffff.png&text=Adventure+Awaits",
  },
  "creative-dreamer": {
    url: "https://samplelib.com/lib/preview/mp4/sample-10s.mp4",
    thumbnailUrl: "https://dummyimage.com/800x450/9333ea/ffffff.png&text=Creative+Dreamer",
  },
  "curious-scientist": {
    url: "https://samplelib.com/lib/preview/mp4/sample-15s.mp4",
    thumbnailUrl: "https://dummyimage.com/800x450/0f766e/ffffff.png&text=Curious+Scientist",
  },
  "kindhearted-friend": {
    url: "https://samplelib.com/lib/preview/mp4/sample-12s.mp4",
    thumbnailUrl: "https://dummyimage.com/800x450/f97316/ffffff.png&text=Kindhearted+Friend",
  },
  "determined-hero": {
    url: "https://samplelib.com/lib/preview/mp4/sample-20s.mp4",
    thumbnailUrl: "https://dummyimage.com/800x450/be123c/ffffff.png&text=Determined+Hero",
  },
};

export async function generateMockVideo(characterId: string): Promise<MockVideoAsset> {
  return CHARACTER_VIDEO_MAP[characterId] || DEFAULT_VIDEO;
}
