declare module './PublicCveDetail' {
  import * as React from 'react'
  export interface PublicCveDetailProps { cveId: string }
  const Component: React.ComponentType<PublicCveDetailProps>
  export default Component
}
