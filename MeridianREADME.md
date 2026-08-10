## Historic of Meridian General Hopspital
Meridian General Hospital (MGH) is a fictional, established secondary/tertiary healthcare organisation that has provided clinical and administrative services for more than two decades. As the hospital expanded, its information infrastructure evolved incrementally rather than through a single unified technology strategy.

Initially, the hospital relied on a legacy Healthcare Management System (LHMS) introduced to digitise patient registration, appointment scheduling, billing and basic clinical record management. Over time, additional modules and standalone applications were introduced for laboratory services, pharmacy operations, medical imaging, human resources and finance.

The result was a collection of systems that could perform their individual functions but were increasingly difficult to manage as a single, secure environment.

The old system

The legacy environment can be represented as:

                  MERIDIAN GENERAL HOSPITAL
                           │
                  Legacy Healthcare System
                           │
       ┌──────────┬────────┼────────┬──────────┐
       │          │        │        │          │
    Patient    Billing    Lab    Pharmacy    HR
    System     System    System    System    System
       │          │        │        │          │
       └──────────┴────────┼────────┴──────────┘
                           │
                    Multiple Databases
                           │
                    Limited Integration

The problem wasn't necessarily that the legacy system was completely insecure. That's an important distinction.

Its main problem was that security had evolved reactively.

As new functionality was added, new accounts, interfaces, databases, servers and configurations were introduced. Over time this created a larger attack surface and made security management increasingly difficult.

## Why Meridian needed a new system

We can establish seven major drivers.

1. Fragmented information

Different departments maintained information in different systems.

This created:

duplicated patient information
inconsistent records
manual data transfers
difficulty obtaining a complete view of a patient
increased opportunity for human error
2. Legacy security architecture

The original system was designed before modern secure-development practices became central to application development.

Security controls were therefore often implemented as additional controls around the system, rather than being systematically incorporated throughout its architecture and development lifecycle.

3. Excessive or inconsistent access

Different applications used different authentication and authorisation mechanisms.

For example:

Old environment

Doctor ──────► EHR account
Doctor ──────► Laboratory account
Doctor ──────► Imaging account
Doctor ──────► Pharmacy account

Nurse ───────► EHR account
Nurse ───────► Laboratory account
Nurse ───────► Imaging account

This created account-management overhead and made consistent application of least privilege, MFA and access policies difficult.

4. Limited security visibility

The legacy systems generated logs, but those logs were not necessarily centralised.

Therefore, security personnel might have had to examine:

Server A logs
      +
Database B logs
      +
Application C logs
      +
Authentication logs
      +
Firewall logs

individually.

That makes identifying a coordinated attack considerably harder.

5. Difficult patch and configuration management

Another major issue:

The hospital couldn't treat the entire environment as one manageable system.

Different applications could have:

different versions
different dependencies
different patch schedules
different configurations
different administrators

A vulnerability in one component could therefore remain unresolved because of compatibility concerns or lack of visibility.

6. Increasing data volume

As Meridian grew, the quantity of healthcare information increased dramatically.

The organisation needed to securely manage:

patient demographics
clinical records
laboratory results
prescriptions
medical images
appointment information
billing information
staff information
audit records

The system therefore needed to support not only availability and performance, but also strong confidentiality and integrity controls.

7. Increasing interoperability requirements

The hospital increasingly needed its systems to communicate with one another and with external healthcare services.

This meant that the new architecture needed secure:

APIs
authentication
data exchange
service-to-service communication
logging
validation
encryption

References

This is consistent with the broader healthcare technology environment, where interconnected systems such as electronic health records, imaging systems and other clinical applications create complex dependencies. NIST's healthcare PACS work, for example, specifically describes healthcare environments as highly interconnected and identifies cybersecurity of these systems as a critical concern. (https://csrc.nist.gov/pubs/sp/1800/24/final?utm_source=chatgpt.com)

Modern secure-development guidance such as NIST's SSDF recommends integrating security practices throughout the SDLC rather than treating security as something performed only at the end.
https://csrc.nist.gov/pubs/sp/800/218/final?utm_source=chatgpt.com

NIST's healthcare cybersecurity guidance provides a useful real-world reference point here because clinical systems such as PACS operate within complex environments containing many interconnected systems. (https://csrc.nist.gov/pubs/sp/1800/24/final?utm_source=chatgpt.com)
