import { createMockEntitiesState } from "__support__/store";
import { renderWithProviders, screen } from "__support__/ui";
import { checkNotNull } from "metabase/lib/types";
import { getMetadata } from "metabase/selectors/metadata";
import { createMockDatabase } from "metabase-types/api/mocks";
import { createMockState } from "metabase-types/store/mocks";
import userEvent from "@testing-library/user-event";
import DataSelectorDatabasePicker from "./DataSelectorDatabasePicker";

const TEST_DATABASE = createMockDatabase({ id: 1, name: "DB One" });
const SECOND_TEST_DATABASE = createMockDatabase({ id: 2, name: "DB Two" });

type SetupOptions = {
  hasOnBack?: boolean;
  databases?: Array<typeof TEST_DATABASE>;
};

const setup = ({ hasOnBack = false, databases = [TEST_DATABASE, SECOND_TEST_DATABASE] }: SetupOptions = {}) => {
  const onBack = hasOnBack ? jest.fn() : undefined;

  const state = createMockState({
    entities: createMockEntitiesState({
      databases: databases,
    }),
  });
  const metadata = getMetadata(state);
  const databasesList = databases.map(db => checkNotNull(metadata.database(db.id)));

  const utils = renderWithProviders(
    <DataSelectorDatabasePicker
      databases={databasesList}
      onChangeDatabase={jest.fn()}
      onChangeSchema={jest.fn()}
      onBack={onBack}
    />,
  );

  return {
    ...utils,
    onBack,
  };
};

describe("DataSelectorDatabasePicker", () => {
  it("displays database name", () => {
    setup();
    expect(screen.getByText(TEST_DATABASE.name)).toBeInTheDocument();
    expect(screen.getByText(SECOND_TEST_DATABASE.name)).toBeInTheDocument();
  });

  it("does not call onBack when there is no onBack prop (No onBack && sectionIndex = 0)", () => {
    setup();
    expect(screen.queryByText("Raw Data")).not.toBeInTheDocument();
  });

  it("calls onBack when clicking the navigation section (there is onBack && sectionIndex = 0)", async () => {
    const { onBack } = setup({ hasOnBack: true });
    const backButton = screen.getByText("Raw Data");
    expect(backButton).toBeInTheDocument();
    const headers = screen.getAllByTestId("list-section-header");
    expect(onBack).not.toHaveBeenCalled();
    await userEvent.click(headers[0]);
    expect(onBack).toHaveBeenCalled();
  });

  it("does not call onBack when another section is selected (there is onBack && sectionIndex != 0)", async () => {
    const { onBack } = setup({ hasOnBack: true });
    const backButton = screen.getByText("Raw Data");
    expect(backButton).toBeInTheDocument();
    const headers = screen.getAllByTestId("list-section-header");
    await userEvent.click(headers[1]);
    expect(onBack).not.toHaveBeenCalled();
  });

  it("should render loading when there is no databases", () => {
    setup({ databases: [] });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
