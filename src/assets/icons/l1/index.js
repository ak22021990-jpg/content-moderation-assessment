import CopyrightIcon from './CopyrightIcon.jsx'
import HateIcon from './HateIcon.jsx'
import ViolenceIcon from './ViolenceIcon.jsx'
import SexualIcon from './SexualIcon.jsx'
import MinorIcon from './MinorIcon.jsx'
import RegulatedIcon from './RegulatedIcon.jsx'
import MisinfoIcon from './MisinfoIcon.jsx'
import SpamIcon from './SpamIcon.jsx'
import BrandSafetyIcon from './BrandSafetyIcon.jsx'
import CommunityIcon from './CommunityIcon.jsx'
import FallbackIcon from './FallbackIcon.jsx'

export const ICONS = {
  copyright: CopyrightIcon,
  hate: HateIcon,
  violence: ViolenceIcon,
  sexual: SexualIcon,
  minor: MinorIcon,
  regulated: RegulatedIcon,
  misinfo: MisinfoIcon,
  spam: SpamIcon,
  brandSafety: BrandSafetyIcon,
  community: CommunityIcon,
}

export function getL1Icon(iconKey) {
  return ICONS[iconKey] || FallbackIcon
}

export {
  CopyrightIcon,
  HateIcon,
  ViolenceIcon,
  SexualIcon,
  MinorIcon,
  RegulatedIcon,
  MisinfoIcon,
  SpamIcon,
  BrandSafetyIcon,
  CommunityIcon,
  FallbackIcon,
}
