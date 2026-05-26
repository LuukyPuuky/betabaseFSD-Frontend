# BetaBase Unit Tests

This folder contains the unit tests for the BetaBase climbing application.

The tests verify that:

- components render correctly
- user interactions behave as expected
- validation rules work properly
- authentication setup is configured correctly

The project uses:

- **Jest** for testing
- **React Native Testing Library** for component testing

---

# Folder Structure

```text
__tests__/
├── FeedCard.test.tsx      # Feed card component tests
├── supabase.test.ts       # Supabase authentication tests
├── validators.test.ts     # Validation utility tests
└── README.md
```

---

# Running Tests

## Run all tests

```bash
npm run test
```

## Run a specific test file

```bash
npm run test FeedCard.test.tsx
npm run test supabase.test.ts
npm run test validators.test.ts
```

## Watch mode

Automatically reruns tests when files change.

```bash
npm run test -- --watch
```

## Generate coverage report

```bash
npm run test -- --coverage
```

---

# Test Suites

---

# 1. FeedCard Component Tests

**File:** `FeedCard.test.tsx`

These tests verify the behavior of the social climbing feed card component.

## What is tested

### Rendering

Checks that the component displays:

- user information
- climbing gym name
- climbing grade
- video player
- action buttons
- video information

### Follow Button

Checks:

- follow state changes
- unfollow behavior
- state persistence after rerendering

### Video Playback UI

Checks:

- play icon visibility
- active/inactive states
- video rendering behavior

### Different Input Data

Checks that the component works correctly with:

- different gym names
- numeric and string IDs
- special characters

### Edge Cases

Checks:

- rapid button presses
- rendering stability

---

## Example Tests

```typescript
test("renders user information", () => {
  expect(getByText("James Doe")).toBeTruthy();
});

test("changes from Follow to Following", async () => {
  fireEvent.press(getByText("Follow"));

  await waitFor(() => {
    expect(getByText("Following")).toBeTruthy();
  });
});
```

---

## Why These Tests Matter

These tests help ensure:

- users see correct climbing information
- interactions behave consistently
- UI changes do not break existing features
- component refactoring is safer

---

# 2. Supabase Authentication Tests

**File:** `supabase.test.ts`

These tests verify the authentication and database client configuration.

## What is tested

- Supabase client initialization
- environment variable validation
- JWT token handling
- authorization header configuration

---

## Example Tests

```typescript
✓ initializes Supabase client correctly
✓ throws error when URL is missing
✓ throws error when API key is missing
✓ attaches Bearer token correctly
```

---

## Why These Tests Matter

Authentication is security-critical.

These tests help prevent:

- invalid configuration
- unauthorized access
- broken authentication requests

---

# 3. Validation Tests

**File:** `validators.test.ts`

These tests verify data validation logic before information is saved to the database.

## What is tested

- V-grade validation
- climbing style validation
- video URL validation
- gym name validation
- description validation

---

## Example Tests

```typescript
✓ accepts valid V-grades
✓ rejects invalid V-grades
✓ accepts valid climbing styles
✓ rejects invalid gym names
```

---

## Why These Tests Matter

Validation tests ensure:

- data consistency
- cleaner database entries
- better user feedback
- prevention of invalid input

---

# 🧱 Testing Structure Used

The tests follow a consistent structure to improve readability and maintainability.

---

## Arrange → Act → Assert Pattern

### Arrange

Prepare test data and render components.

```typescript
const { getByText } = renderFeedCard();
```

### Act

Simulate user interaction.

```typescript
fireEvent.press(getByText("Follow"));
```

### Assert

Verify the expected result.

```typescript
expect(getByText("Following")).toBeTruthy();
```

---

# Mocking Strategy

Mocks are used to isolate components and avoid relying on external libraries during tests.

---

## Mocked Libraries

### Expo Video

```typescript
jest.mock("expo-video", () => ({
  VideoView: () => <View testID="video-view" />,
}));
```

### Expo Vector Icons

```typescript
jest.mock("@expo/vector-icons", () => ({
  Feather: ({ name }) => (
    <View testID={`icon-${name}`} />
  ),
}));
```

---

## Why Mocking Is Important

Mocking helps:

- speed up tests
- avoid network calls
- isolate component behavior
- improve reliability

---

# 📝 Test Naming Convention

Tests use short and descriptive names.

## Examples

Good

```typescript
test("renders user information");
test("toggles back to Follow");
test("shows play icon when inactive");
```

Avoid

```typescript
test("works correctly");
test("button test");
```

Good test names:

- describe behavior clearly
- improve readability
- act as documentation

---

# Debugging Tests

## Print rendered component tree

```typescript
const { debug } = renderFeedCard();
debug();
```

## Run one specific test

```bash
npm run test -- FeedCard.test.tsx --testNamePattern="Follow"
```

---

# Coverage Goals

Current tests focus on:

- rendering
- user interaction
- validation
- authentication

Future improvements may include:

- navigation testing
- API error handling
- profile management
- direct messaging
- sharing functionality

---

# 📚 Resources

- Jest Documentation
  [Jest Documentation](https://jestjs.io/?utm_source=chatgpt.com)

- React Native Testing Library
  [React Native Testing Library](https://testing-library.com/docs/react-native-testing-library/intro/?utm_source=chatgpt.com)

- Testing Best Practices
  [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library?utm_source=chatgpt.com)

---

# ✅ Before Committing

```text
[ ] All tests pass
[ ] Linting passes
[ ] Coverage report generates correctly
[ ] New tests use clear naming
[ ] Mocks are isolated properly
[ ] No unnecessary duplication
```

Run:

```bash
npm run test
npm run lint
npm run test -- --coverage
```

---

# 🔗 Related Files

- `jest.config.js`
- `package.json`
- `BETABASE_QA_REPORT.md`

---

This test suite is designed to prioritize:

- readability
- maintainability
- reliability
- realistic user behavior testing
- professional QA practices
