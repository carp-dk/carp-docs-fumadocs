import type { ReactNode } from 'react';
import type { BaseLayoutProps } from '@/components/m3e/layout';
import { appName } from './shared';
import { AccountTreeIcon, AppsIcon, AssignmentIcon, BoltIcon, BookIcon, BugIcon, BuildIcon, CallIcon, CodeIcon, DatabaseIcon, DatasetIcon, DownloadIcon, EcgHeartIcon, ExtensionIcon, FitnessTrackerIcon, HeadphonesIcon, HeartIcon, HubIcon, LocationIcon, MailIcon, MicIcon, MonitorHeartIcon, QuizIcon, SchoolIcon, SensorsIcon, StarIcon, StorageIcon, VitalSignsIcon, WatchIcon, WifiIcon } from '@/components/ui/icons';
import { BrandMark, DiscordIcon, GitHubIcon } from '@/components/ui/brand-icons';

// Each Flutter package: docs section, pub.dev name and API reference. The category picks its
// navbar menu: the CAMS framework has its own, then Flutter plugins and sampling packages.
type Category = 'framework' | 'plugin' | 'sampling';
const packages: { text: string; name: string; summary: string; url: string; icon: ReactNode; category: Category }[] = [
  { text: 'Mobile Sensing', name: 'carp_mobile_sensing', summary: 'Collect data from phone sensors, wearables and users', url: '/docs/mobile-sensing', icon: <SensorsIcon />, category: 'framework' },
  { text: 'Health', name: 'health', summary: 'Read and write health data from Android & iOS', url: '/docs/flutter-plugins/health', icon: <HeartIcon />, category: 'plugin' },
  { text: 'Research Package', name: 'research_package', summary: 'Surveys, informed consent and results in Flutter apps', url: '/docs/flutter-plugins/research-package', icon: <AssignmentIcon />, category: 'plugin' },
  { text: 'Debug Toolkit', name: 'carp_debug_flutter', summary: 'In-app debugging tools for Flutter apps', url: '/docs/flutter-plugins/debug-toolkit', icon: <BugIcon />, category: 'plugin' },
  { text: 'Context Sampling', name: 'carp_context_package', summary: 'Location, activity, mobility, weather and air quality', url: '/docs/sampling-packages/context', icon: <LocationIcon />, category: 'sampling' },
  { text: 'Survey Sampling', name: 'carp_survey_package', summary: 'Surveys and cognitive tests as app tasks', url: '/docs/sampling-packages/survey', icon: <QuizIcon />, category: 'sampling' },
  { text: 'Health Sampling', name: 'carp_health_package', summary: 'Health Connect and Apple Health data in a study', url: '/docs/sampling-packages/health', icon: <MonitorHeartIcon />, category: 'sampling' },
  { text: 'Audio Sampling', name: 'carp_audio_package', summary: 'Ambient noise and audio recordings', url: '/docs/sampling-packages/audio', icon: <MicIcon />, category: 'sampling' },
  { text: 'Connectivity Sampling', name: 'carp_connectivity_package', summary: 'Network status, Wi-Fi, Bluetooth and beacons', url: '/docs/sampling-packages/connectivity', icon: <WifiIcon />, category: 'sampling' },
  { text: 'Communication Sampling', name: 'carp_communication_package', summary: 'Phone calls, text messages and calendar events', url: '/docs/sampling-packages/communication', icon: <CallIcon />, category: 'sampling' },
  { text: 'Apps Sampling', name: 'carp_apps_package', summary: 'Installed apps and app usage on Android', url: '/docs/sampling-packages/apps', icon: <AppsIcon />, category: 'sampling' },
  { text: 'Apple Watch Sensing', name: 'carp_aware_package', summary: 'Passive sensor data from an Apple Watch', url: '/docs/sampling-packages/apple-watch', icon: <WatchIcon />, category: 'sampling' },
  { text: 'Polar Sampling', name: 'carp_polar_package', summary: 'Heart rate, ECG and motion from Polar sensors', url: '/docs/sampling-packages/polar', icon: <EcgHeartIcon />, category: 'sampling' },
  { text: 'Movesense Sampling', name: 'carp_movesense_package', summary: 'Heart rate, ECG and motion from Movesense sensors', url: '/docs/sampling-packages/movesense', icon: <VitalSignsIcon />, category: 'sampling' },
  { text: 'Movisens Sampling', name: 'carp_movisens_package', summary: 'Activity, heart rate and EDA from Movisens sensors', url: '/docs/sampling-packages/movisens', icon: <FitnessTrackerIcon />, category: 'sampling' },
  { text: 'eSense Sampling', name: 'carp_esense_package', summary: 'Button and motion events from eSense earables', url: '/docs/sampling-packages/esense', icon: <HeadphonesIcon />, category: 'sampling' },
];
const packageLinks = (category: Category) => packages.filter(item => item.category === category).map(({ text, name, summary, url, icon }) => ({ text, badge: name, description: summary, url, icon }));

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      // JSX supported
      title: <span className="docs-site-title"><BrandMark className="docs-brand-mark" />{appName}</span>,
      // The site opens on the docs, so the title links there directly.
      url: '/docs',
    },
    links: [
      { type: 'menu', text: 'Get started', items: [
        { text: 'Introduction', description: 'What CARP is and how its parts fit together', url: '/docs/introduction', icon: <BookIcon /> },
        { text: 'Quickstart', description: 'Build a Flutter app that collects data', url: '/docs/quickstart', icon: <BoltIcon /> },
        { text: 'Terminology', description: 'Protocols, devices, measures and deployments', url: '/docs/concepts', icon: <SchoolIcon /> },
        { text: 'Architecture', description: 'From study protocol to data upload', url: '/docs/architecture', icon: <HubIcon /> },
        { text: 'Storing data', description: 'On the phone, in CAWS or on your own server', url: '/docs/data-storage', icon: <DatabaseIcon /> },
      ] },
      { type: 'menu', variant: 'navigation', text: 'Mobile Sensing', items: [
        { text: 'Overview', badge: 'carp_mobile_sensing', description: 'The CAMS framework for Flutter', url: '/docs/mobile-sensing', icon: <SensorsIcon /> },
        { text: 'Installation', description: 'Add the package and configure Android and iOS', url: '/docs/mobile-sensing/installation', icon: <DownloadIcon /> },
        { text: 'Using CAMS', description: 'Define, deploy and run a study protocol', url: '/docs/mobile-sensing/usage', icon: <CodeIcon /> },
        { text: 'Domain model', description: 'Protocols, triggers, tasks, measures and devices', url: '/docs/mobile-sensing/domain-model', icon: <AccountTreeIcon /> },
        { text: 'Measure types', description: 'Every measure, by sampling package and platform', url: '/docs/mobile-sensing/measure-types', icon: <DatasetIcon /> },
        { text: 'Data managers', description: 'Store or upload collected measurements', url: '/docs/mobile-sensing/data-managers', icon: <StorageIcon /> },
        { text: 'Extending CAMS', description: 'Custom triggers, sampling packages and data managers', url: '/docs/mobile-sensing/extending', icon: <ExtensionIcon /> },
        { text: 'Building sampling packages', description: 'Create, test and publish your own sampling package', url: '/docs/mobile-sensing/building-sampling-packages', icon: <BuildIcon /> },
        { text: 'Best practices', description: 'Background sensing, iOS setup and build issues', url: '/docs/mobile-sensing/best-practices', icon: <StarIcon /> },
      ] },
      { type: 'menu', text: 'Flutter Plugins', items: packageLinks('plugin') },
      // Twelve sampling packages: two columns keep the menu within the viewport.
      { type: 'menu', variant: 'navigation', text: 'Sampling Packages', items: packageLinks('sampling') },
      { text: 'Backend API', url: '/docs/backend-api', active: 'nested-url' },
      // { type: 'menu', text: 'API Reference', items: [
      //   { text: 'All CARP packages', description: 'API documentation on pub.dev', url: '/docs/api-reference', icon: <PackageIcon /> },
      //   ...packages.map(({ name, icon }) => ({ text: name, description: 'pub.dev API reference', url: `https://pub.dev/documentation/${name}/latest/`, external: true, icon })),
      // ] },
      // { type: 'menu', text: 'Community', items: [
      //   { text: 'LinkedIn', description: 'News from the CARP team', url: 'https://www.linkedin.com/company/carp-dk/', external: true, icon: <GroupIcon /> },
      //   { text: 'carp.dk', description: 'The Copenhagen Research Platform', url: 'https://carp.dk', external: true, icon: <WebIcon /> },
      // ] },
      // Icon links sit beside Ask AI in the header (and as rows in the mobile drawer).
      { type: 'icon', text: 'CARP on GitHub', url: 'https://github.com/carp-dk', external: true, icon: <GitHubIcon /> },
      { type: 'icon', text: 'CARP on Discord', url: 'https://discord.gg/sswpqGvnf5', external: true, icon: <DiscordIcon /> },
      { type: 'icon', text: 'Email support', url: 'mailto:support@carp.dk', icon: <MailIcon /> },
    ],
  };
}
