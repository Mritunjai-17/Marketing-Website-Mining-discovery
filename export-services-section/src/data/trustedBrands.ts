export interface TrustedBrand {
  name: string;
  logo: string;
}

/*
 * The Trusted Brands roster from miningdiscovery.com/about-us.
 *
 * Hotlinked straight from miningdiscovery.com rather than copied into /public, matching
 * what TrustedBy.tsx on the homepage already does. The URLs carry literal spaces and are
 * passed through unencoded on purpose: a browser percent-encodes the path when it builds
 * the request, so these resolve, and hand-editing them to %20 or to dashes is how the
 * filenames drift out of sync with the source. They are the source's names, verbatim.
 *
 * "BBluenergies" is not a typo on this side — that is the filename as served.
 *
 * NOTE: TrustedBy.tsx carries its own identical copy of this list. It is a homepage
 * component and this task was scoped to /about only, so it was left untouched rather than
 * switched over to import from here. Pointing it at this file is a two-line change and
 * would remove the duplication whenever that scope opens up.
 */
export const TRUSTED_BRANDS: TrustedBrand[] = [
  { name: "Arras Minerals", logo: "https://www.miningdiscovery.com/trustedbrands/ARRAS Minerals LOGO.png" },
  { name: "Afrikor", logo: "https://www.miningdiscovery.com/trustedbrands/Afrikor LOGO.png" },
  { name: "Arizona Gold & Silver", logo: "https://www.miningdiscovery.com/trustedbrands/Arizona Gold & Silver LOGO.png" },
  { name: "Astra Exploration", logo: "https://www.miningdiscovery.com/trustedbrands/Astra Exploration LOGO.png" },
  { name: "Aurion Resources", logo: "https://www.miningdiscovery.com/trustedbrands/Aurion Resources LOGO.png" },
  { name: "Bluenergies", logo: "https://www.miningdiscovery.com/trustedbrands/BBluenergies LOGO.png" },
  { name: "Bactech", logo: "https://www.miningdiscovery.com/trustedbrands/Bactech LOGO.png" },
  { name: "Digipower X", logo: "https://www.miningdiscovery.com/trustedbrands/DIGIPOWER X LOGO.png" },
  { name: "Gold Hunter Resources", logo: "https://www.miningdiscovery.com/trustedbrands/Gold Hunter Resources LOGO.png" },
  { name: "Golkor", logo: "https://www.miningdiscovery.com/trustedbrands/Golkor LOGO.png" },
  { name: "Guanajuato", logo: "https://www.miningdiscovery.com/trustedbrands/Guanajuato LOGO.png" },
  { name: "Harfang", logo: "https://www.miningdiscovery.com/trustedbrands/Harfang LOGO.png" },
  { name: "He Capital", logo: "https://www.miningdiscovery.com/trustedbrands/He Capital LOGO.png" },
  { name: "Kodiak Copper", logo: "https://www.miningdiscovery.com/trustedbrands/Kodiak Copper LOGO.png" },
  { name: "Leviathan", logo: "https://www.miningdiscovery.com/trustedbrands/Leviathan LOGO.png" },
  { name: "Loyalist", logo: "https://www.miningdiscovery.com/trustedbrands/Loyalist LOGO.png" },
  { name: "Mining Investment Event", logo: "https://www.miningdiscovery.com/trustedbrands/Mining Investment Event LOGO.png" },
  { name: "Noble Plains", logo: "https://www.miningdiscovery.com/trustedbrands/Noble Plains LOGO.png" },
  { name: "Pan Global", logo: "https://www.miningdiscovery.com/trustedbrands/Pan Global LOGO.png" },
  { name: "Phenom Resources", logo: "https://www.miningdiscovery.com/trustedbrands/Phenom Resources LOGO.png" },
  { name: "Power Metallic", logo: "https://www.miningdiscovery.com/trustedbrands/Power Metallic LOGO.png" },
  { name: "SilverWolf", logo: "https://www.miningdiscovery.com/trustedbrands/SilverWolf LOGO.png" },
  { name: "Spacekor", logo: "https://www.miningdiscovery.com/trustedbrands/Spacekor LOGO.png" },
  { name: "US Gold", logo: "https://www.miningdiscovery.com/trustedbrands/US GOLD LOGO.png" },
  { name: "USDC", logo: "https://www.miningdiscovery.com/trustedbrands/USDC LOGO.png" },
  { name: "Vivio Power", logo: "https://www.miningdiscovery.com/trustedbrands/Vivio Power LOGO.png" },
  { name: "West Red Lake", logo: "https://www.miningdiscovery.com/trustedbrands/West Red Lake LOGO.png" },
];
