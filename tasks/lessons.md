# Lessons Learned

## Date: 2026-03-21

### Lesson: Dependency Update Strategy

**Context**: Updated 40 packages in `apps/project-dashboard` using a phased approach.

**Mistake/Risk Avoided**: 
- Could have updated all packages at once including major versions
- Major version updates (zod v4, recharts v3, sonner v2, etc.) could introduce breaking changes

**Root Cause**: 
- Major version updates often include API changes requiring code modifications
- Not all major updates are necessary if current versions work fine

**Preventative Rule**:
1. Use a phased approach: Patch/Minor first, Major later
2. Test build after each phase
3. Research changelogs before major version updates
4. Consider keeping major versions if no compelling reason to upgrade
5. Commit between phases for easy rollback

**Applied In**: `apps/project-dashboard` dependency updates - completed Phase 1 & 2, deferred Phase 3 & 4 major updates.
